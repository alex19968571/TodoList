# KingList

個人與群組任務管理 Web 應用程式，採用 AngularJS 1.8.3 + Firebase 架構（Firestore + Auth），並提供 Angular 18 + ASP.NET Core 8 的完整重構版本。功能包含週視圖、行事曆、逾期追蹤、提醒通知與即時群組協作。

---

## 功能特色

| 類別 | 說明 |
|---|---|
| **任務管理** | 新增、編輯、刪除任務；支援名稱、描述、優先級、標籤、地點、子步驟 |
| **啟用時間** | 設定啟用時間後，任務將在啟用日至截止日之間每天持續顯示 |
| **提醒通知** | 瀏覽器通知：事件到時、提前 5/15/30 分鐘、1 小時，或自訂時間 |
| **多種視圖** | 列表視圖、週視圖（7 天分頁）、行事曆（Outlook 風格月份格） |
| **未完成事項** | 截止日已過且未完成的任務自動移入「未完成事項」區塊 |
| **近期刪除** | 30 天軟刪除，可復原或永久刪除；個人與群組任務各自獨立 |
| **過濾與排序** | 依日期區間過濾、隱藏已完成；依名稱/日期/啟用時間/優先級/標籤排序 |
| **群組任務** | 透過 Firestore `onSnapshot` 即時同步多人群組任務；以 6 碼邀請碼加入 |
| **版面主題** | 淺色/深色/系統主題；自訂元件顏色；可為每個視圖或日期格設定背景圖 |
| **多語系** | 繁體中文（zh-TW）及英文（en-US）；自動偵測系統語言；支援外部 JSON 語系檔 |
| **頭貼** | 上傳大頭照，壓縮後以 base64 儲存於 Firestore |
| **訪客模式** | 未登入時以 localStorage 完整運作；登入後自動同步至雲端 |

---

## 技術架構

### 原始版本（單一檔案）

| 層級 | 技術 |
|---|---|
| 前端框架 | AngularJS 1.8.3 |
| 後端 / 驗證 | Firebase Authentication（Google 登入） |
| 資料庫 | Cloud Firestore |
| UI 元件庫 | Bootstrap 5 + Bootstrap Icons |
| 語系 | 外部 JSON 語系檔（`locales/zh-TW.json`、`locales/en-US.json`） |
| 部署 | 任何靜態主機（GitHub Pages、Firebase Hosting、Nginx 等） |

### 重構版本（`KingList.Api/` + `KingList.Web/`）

| 層級 | 技術 |
|---|---|
| 前端框架 | Angular 18（Standalone Components、Signals） |
| 後端框架 | ASP.NET Core 8 Web API（C#） |
| 驗證 | Firebase Auth（前端取得 ID token）→ Firebase Admin SDK（後端驗證） |
| 資料庫 | Cloud Firestore（透過 Firebase Admin SDK 在後端存取） |
| 即時通訊 | SignalR（群組任務即時推送） |
| UI 元件庫 | Bootstrap 5 + Bootstrap Icons |
| 語系 | `@ngx-translate/core` |
| 通知 | `ngx-toastr` |
| CI/CD | GitHub Actions |

---

## 專案目錄結構

```
KingList/
├── index.html              # 原始版：所有 HTML + CSS + AngularJS 邏輯
├── logo.png                # 側邊欄顯示的應用程式 Logo
├── locales/
│   ├── zh-TW.json          # 繁體中文語系
│   └── en-US.json          # 英文語系
├── README.md
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions CI/CD 流程
├── KingList.Api/           # ASP.NET Core 8 後端
│   ├── KingList.Api.csproj
│   ├── Program.cs
│   ├── appsettings.json
│   ├── Controllers/        # UsersController、TasksController、GroupsController、TranslationController
│   ├── Hubs/               # GroupHub（SignalR）
│   ├── Middleware/         # FirebaseAuthMiddleware（驗證 Firebase ID token）
│   ├── Models/             # TaskItem、Group、UserData、UserSettings
│   └── Services/           # FirebaseService（Admin SDK 初始化）
└── KingList.Web/           # Angular 18 前端
    ├── package.json
    ├── angular.json
    ├── tsconfig.json
    ├── proxy.conf.json     # 開發時代理 API 至後端
    └── src/
        ├── main.ts
        ├── styles.scss
        ├── environments/   # environment.ts / environment.prod.ts（填入 Firebase 設定）
        └── app/
            ├── app.config.ts
            ├── app.routes.ts
            ├── app.component.ts
            ├── core/
            │   ├── guards/auth.guard.ts
            │   ├── interceptors/auth.interceptor.ts  # 自動帶入 Bearer token
            │   └── services/                          # AuthService、UserService、GroupService、SettingsService
            ├── models/                                # task.model.ts、group.model.ts
            └── features/                              # login、layout、today、week、calendar、group-tasks、settings
```

---

## Firebase 設定

### 步驟一：建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/) 建立新專案。
2. 在「Authentication → 登入方式」中啟用 **Google 登入**。
3. 建立 **Firestore 資料庫**（以正式環境模式啟動）。

### 步驟二：設定 Firestore 安全性規則

在 Firebase Console → Firestore → 規則，貼上以下內容：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /groupCodes/{code} {
      allow read:           if request.auth != null;
      allow create:         if request.auth != null;
      allow update, delete: if false;
    }

    match /groups/{groupId} {
      allow read:   if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.createdBy == request.auth.uid;
      allow update: if request.auth != null
                    && resource.data.members[request.auth.uid] != null;
      allow delete: if request.auth != null
                    && resource.data.createdBy == request.auth.uid;

      match /tasks/{taskId} {
        allow read, write: if request.auth != null
          && get(/databases/$(database)/documents/groups/$(groupId))
               .data.members[request.auth.uid] != null;
      }
    }
  }
}
```

### 步驟三：填入 Firebase 設定

**原始版本（`index.html`）**：搜尋 `firebaseConfig`，替換為你的 Firebase 專案設定值：

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

**重構版本（Angular）**：編輯 `KingList.Web/src/environments/environment.ts`，填入相同的 Firebase 設定值。

**重構版本（ASP.NET Core）**：
1. 在 `KingList.Api/appsettings.json` 填入 `Firebase:ProjectId`。
2. 從 Firebase Console → 專案設定 → 服務帳戶，下載 Service Account JSON 金鑰，命名為 `firebase-service-account.json` 放入 `KingList.Api/`（**此檔案不可 commit 至 Git**）。

---

## 部署方式

### GitHub Pages（原始版本，僅靜態）

1. 將整個 `KingList/` 目錄推送至 GitHub Repository。
2. 在 Repository 的「Settings → Pages」設定來源為 `main` 分支的根目錄。
3. 應用程式即可透過 `https://<使用者名稱>.github.io/<repository>/` 存取。

> **注意**：`locales/` 資料夾必須與 `index.html` 在同一目錄下。

### Firebase Hosting（原始版本）

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # 選擇專案，設定 public 目錄為 "."
firebase deploy
```

### GitHub Actions + Azure App Service（重構版本）

儲存庫已內建 `.github/workflows/deploy.yml`，推送至 `main` 分支時自動：

1. 安裝相依套件並建置 Angular
2. 將建置產物複製到 ASP.NET Core 的 `wwwroot`
3. 發佈 ASP.NET Core
4. 上傳成品（可替換為 Azure App Service、Railway、Render 等部署步驟）

> **ASP.NET Core 部署**不支援 GitHub Pages（GitHub Pages 僅供靜態檔案），建議使用 Azure App Service、Railway 或 Render 等支援 .NET 的主機。

### 任何靜態伺服器（Nginx / Apache，原始版本）

直接以根目錄作為網頁根目錄提供服務，不需要任何建置步驟。

---

## Firestore 資料結構

```
users/{uid}
  tasks:      TaskItem[]               # 個人任務清單
  settings:   UserSettings             # 主題、語系、字體大小等設定
  trash:      TaskItem[]               # 個人軟刪除任務（30 天保留）
  groupTrash: TaskItem[]               # 群組軟刪除任務（本地快取）
  groups:     string[]                 # 已加入的群組 ID 清單
  avatarUrl:  string                   # base64 大頭照

groups/{groupId}
  name:       string
  inviteCode: string                   # 6 碼大寫英數邀請碼
  createdBy:  string (uid)
  members:    { [uid]: { email, joinedAt, role: "owner"|"member" } }

groups/{groupId}/tasks/{taskId}
  # 與個人任務相同欄位，另加：
  createdBy:  string (uid)
  updatedBy:  string (uid)
  updatedAt:  Timestamp

groupCodes/{inviteCode}
  groupId:    string
```

---

## 任務資料格式

```typescript
{
  id:                 string
  text:               string          // 任務名稱
  description:        string          // 備註說明
  date:               string          // "YYYY-MM-DD"，任務顯示日期
  startTime?:         string          // "YYYY-MM-DDTHH:mm"，啟用時間
  deadline?:          string          // "YYYY-MM-DDTHH:mm"，截止期限
  priority:           "1" | "2" | "3" | "4"   // 1=紅, 2=橙, 3=藍, 4=灰
  tags:               string[]
  steps:              { id, text, done }[]     // 子步驟
  location:           string
  reminderType:       "0" | "5" | "15" | "30" | "60" | "custom"
  customReminderTime?: string         // 自訂提醒時間
  calculatedReminder?: string         // 計算後的 ISO 提醒時間
  completed:          boolean
  isOverdue:          boolean
}
```

---

## 多語系說明

語系檔位於 `locales/`，應用程式以 `fetch()` 載入對應語系，若失敗則退回內嵌的 TR 物件（可在 `file://` 本地開啟時使用）。

首次造訪時，語系會**自動偵測系統語言**（`navigator.language`）：
- 中文系列（zh、zh-TW、zh-CN、zh-HK 等）→ 繁體中文（zh-TW）
- 其他語言 → 英文（en-US）

使用者在設定頁面手動切換語系後，會儲存至 localStorage，下次開啟時優先使用儲存值。

### 新增語系步驟

1. 複製 `locales/en-US.json` 為 `locales/<語系代碼>.json`，翻譯所有值。
2. 在設定頁面的語系選單新增對應的 `<option>`。
3. 在 `onLangChange()` 中處理對應的月份陣列與週標題陣列。

---

## 本地開發

### 原始版本

不需要建置步驟，直接以瀏覽器開啟 `index.html` 即可。

> **CORS 注意**：從 `file://` 開啟時，`fetch()` 語系檔會失敗，建議使用本地伺服器：

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

### 重構版本

```bash
# 1. 啟動 ASP.NET Core 後端
cd KingList.Api
dotnet run

# 2. 啟動 Angular 開發伺服器（另開終端機）
cd KingList.Web
npm install
npm start
# → Angular 開發伺服器在 http://localhost:4200，
#   透過 proxy.conf.json 將 /api 與 /hubs 代理至 ASP.NET Core
```

---

## 瀏覽器支援

| 瀏覽器 | 支援狀況 |
|---|---|
| Chrome / Edge 90+ | 完整支援 |
| Firefox 88+ | 完整支援 |
| Safari 14+ | 完整支援 |
| 行動版 Chrome / Safari | 完整支援（響應式版面） |

> `datetime-local` 輸入框的日期格式（`MM/DD/YYYY` vs `年/月/日`）由 HTML `lang` 屬性控制，應用程式在切換語系時會動態更新此屬性。

---

## 授權

MIT
