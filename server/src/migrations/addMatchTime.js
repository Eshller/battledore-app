import { Match } from "../Models/matchs.model.js";
import mongoose from "mongoose";
import { fileURLToPath } from 'url';

const addMatchTimeToExistingMatches = async () => {
	try {
		const matches = await Match.find({ matchTime: { $exists: false } });

		for (const match of matches) {
			await Match.findByIdAndUpdate(match._id, {
				$set: {
					matchTime: {
						minutes: 0,
						seconds: 0,
					},
				},
			});
		}
	} catch (error) {
		console.error("Error updating matches:", error);
	}
};

// Run the migration if this file is executed directly
// ES modules compatible approach
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
	mongoose
		.connect(process.env.MONGODB_URI)
		.then(() => {
			return addMatchTimeToExistingMatches();
		})
		.then(() => {
			process.exit(0);
		})
		.catch((error) => {
			console.error("Migration failed:", error);
			process.exit(1);
		});
}

export default addMatchTimeToExistingMatches;
