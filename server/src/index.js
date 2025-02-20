import dotenv from "dotenv";
import { server } from "./app.js";
import connectDB from "./DB/database.js";

dotenv.config({ path: "./env" });
/*   
add this line to script tag in package.json
"dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
*/
connectDB()
  .then(() => {
    server.listen(process.env.PORT || 8000, () => {
      console.log(`Server is runing at port ${process.env.PORT}`);
      console.log(`Database is connected at ${process.env.DBNAME}`);
    });
  })
  .catch((err) => console.log("MONGO DB connection failed !!! ", err.message));
