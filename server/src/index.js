import dotenv from "dotenv";
import { server } from "./app.js";
import connectDB from "./DB/database.js";
import addMatchTimeToExistingMatches from "./migrations/addMatchTime.js";

dotenv.config({ path: "./env" });
/*   
add this line to script tag in package.json
"dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
*/

connectDB()
  .then(async () => {
    // Run migration once database is connected
    // Comment this out after running once
    await addMatchTimeToExistingMatches();
    
    // Start server
    server.listen(process.env.PORT || 8000, () => {
      console.log(`Server is runing at port ${process.env.PORT}`);
      console.log(`Database is connected at ${process.env.DBNAME}`);
    });
  })
  .catch((err) => console.error("MongoDB connection failed:", err.message));
