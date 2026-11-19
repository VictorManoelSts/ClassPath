const database = db.getSiblingDB(process.env.MONGO_DB_NAME);
const user = process.env.MONGO_APP_USER;
const pwd = process.env.MONGO_APP_PASSWORD;
if (!user || !pwd) throw new Error("Configure a conta de serviço MongoDB.");
if (!database.getUser(user)) {
    database.createUser({ user, pwd, roles: [{ role: "readWrite", db: database.getName() }] });
}
