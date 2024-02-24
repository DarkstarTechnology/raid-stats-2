import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { IAlliance, db } from 'src/app/processor/db';

@Injectable({
  providedIn: 'root'
})
export class AllianceService {

  constructor() { }

  getAlliances(): Observable<IAlliance[]> {
    return from(db.alliances.toArray());
  }

  async getAllianceById(id: number) {
    return await db.alliances.get(id);
  }

  saveAlliance(alliance: IAlliance) {
    return db.alliances.put(alliance);
  }

  async getActiveAlliance() {
    return await db.alliances.where('isActive').equals('true').first();
  }

  

  async deleteAlliance(alliance: IAlliance) {
    await db.alliances.delete(alliance.id);
  }

  async cleanUpAlliances() {
    console.log("Starting cleanup...");

    // Delete alliances with empty primary and isActive true
    console.log("Deleting alliances with empty primary and isActive true...");
    await db.alliances.filter(a => a.primary.length === 0).delete();
    console.log("Alliances with empty primary and isActive true deleted.");

    // Get all alliances after cleanup
    console.log("Fetching alliances after cleanup...");
    const alliances = await db.alliances.toArray();
    console.log("Alliances after cleanup:", alliances);

    // If there are no alliances after cleanup, do nothing
    if (alliances.length === 0) {
        console.log("No alliances found after cleanup. Exiting cleanup function.");
        return;
    }

    // Find the default active alliance (if any)
    console.log("Finding default active alliance...");
    const defaultActive = alliances.find(a => a.isActive);

    // If no default active alliance is found, set the first alliance as default active
    if (!defaultActive) {
        console.log("No default active alliance found. Setting the first alliance as default active.");
        alliances[0].isActive = true;
        await db.alliances.put(alliances[0]);
        console.log("First alliance set as default active.");
    }

    console.log("Cleanup complete.");
}


}
