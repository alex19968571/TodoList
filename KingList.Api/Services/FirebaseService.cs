using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Firestore;

namespace KingList.Api.Services;

public class FirebaseService
{
    public FirestoreDb Db { get; }

    public FirebaseService(IConfiguration config)
    {
        Db = FirestoreDb.Create(config["Firebase:ProjectId"]!);
    }

    public static void Initialize(IConfiguration config)
    {
        if (FirebaseApp.DefaultInstance != null) return;

        var keyPath = config["Firebase:ServiceAccountKeyPath"]!;
        FirebaseApp.Create(new AppOptions
        {
            Credential = GoogleCredential.FromFile(keyPath)
        });

        // Set GOOGLE_APPLICATION_CREDENTIALS for Firestore client
        Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", keyPath);
    }
}
