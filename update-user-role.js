// Instructions to update user role in MongoDB

// 1. Open MongoDB Shell (mongosh):
//    mongosh

// 2. Switch to your database:
//    use church-social

// 3. Find your user by email:
//    db.users.findOne({ email: "your-email@example.com" })

// 4. Update your user role to admin:
//    db.users.updateOne(
//      { email: "your-email@example.com" },
//      { $set: { role: "admin" } }
//    )

// 5. Or update to pastor:
//    db.users.updateOne(
//      { email: "your-email@example.com" },
//      { $set: { role: "pastor" } }
//    )

// 6. Or update to sound_engineer:
//    db.users.updateOne(
//      { email: "your-email@example.com" },
//      { $set: { role: "sound_engineer" } }
//    )

// 7. Verify the update:
//    db.users.findOne({ email: "your-email@example.com" })
