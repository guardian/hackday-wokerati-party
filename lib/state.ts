import {
	Cashews,
	GarlicCloves,
	Ginger,
	LimeJuice,
	MapleSyrup,
	MarinatingBowl,
	Oven,
	PicklingBowl,
	Platter,
	SambalSauce,
	SoySauce,
	Thing,
	TofuBlock,
	Vinegar,
	Wallet,
} from "./thing.ts";

export interface State {
	say: (message: string) => void;
	gameOver: boolean;
	inventory: Thing[];
	currentRoom: Room;
	time: number;
	timeLimit: number;
	intro: string[];
}

interface Room {
	name: string;
	description: string;
	exits: string[];
	things: Thing[];
}

class Room {
	constructor(
		name: string,
		description: string,
		exits: string[] = [],
		things: Thing[] = [],
	) {
		this.name = name;
		this.description = description;
		this.exits = exits;
		this.things = things;
	}

	addExit(exit: string) {
		this.exits.push(exit);
	}

	describe() {
		state.say(this.description);
		if (this.things?.length > 0) {
			state.say(
				"You can see: " +
					this.things?.map((thing) => thing.getFullName()).join(", "),
			);
		}
		if (this.exits.length > 0) {
			state.say("Exits: " + this.exits.join(", "));
		}
	}

	// Recursively look for a thing among the things in the room and the things they contain
	// and so on.
	findThing(thing: string) {
		console.log("Looking for", thing, "in", this.things);
		thing = thing.toLowerCase();
		const found = this.things?.find((item) =>
			item.name.toLowerCase().includes(thing)
		);
		if (found) {
			return found;
		}
		for (const item of this.things) {
			const foundInContents = item.findInContents(thing);
			if (foundInContents) {
				return foundInContents;
			}
		}
		return null;
	}
}

export const rooms = [
	new Room(
		"Kitchen",
		"This is a kitchen Nigel Slater would be proud of. Everything is brushed steel. The worktops are brushed steel. The appliances are brushed steel. The floor is brushed steel. You slide around on the brushed steel floor.",
		["hall"],
		[
			new Oven(),
			new TofuBlock(),
			new MarinatingBowl(),
			new PicklingBowl(),
			new SoySauce(),
			new LimeJuice(),
			new Vinegar(),
			new MapleSyrup(),
		],
	),
	new Room(
		"Dining Room",
		"The dining room is tastefully decorated (by your ex, but your date doesn't need to know that). The table is set for two. Music plays softly from recessed speakers.",
		["hall"],
		[
			new Platter(),
		],
	),
	new Room(
		"Hall",
		"Just a regular terraced house hall. Doors lead to the kitchen and dining room. The front door leads out onto the high street.",
		["kitchen", "dining room", "high street"],
		[new Wallet()],
	),
	new Room(
		"High Street",
		"You could have sworn that at some point in the recent past there were fewer betting shops and more local businesses here.",
		[
			"hall",
			"supermarket",
			"greengrocer",
		],
	),
	new Room(
		"Supermarket",
		"Welcome to SainsCoRose! The lights are extremely bright. The floor is extremely shiny. The shelves contain all manner of things (except eggs, fresh vegetables, and cashews).",
		["high street"],
		[new SambalSauce(true)],
	),
	new Room(
		"Greengrocer",
		"You are in a maze of twisty little charming greengrocer aisles, all alike. You have never met anyone who has as many opinions about potatoes as this grocer. The shelves are piled high with fresh fruit and vegetables. There are even cashews!",
		[
			"high street",
		],
		[
			new GarlicCloves(true),
			new Ginger(true),
			new Cashews(true),
		],
	),
];

export const state: State = {
	say: (text) => console.log(text),
	inventory: [],
	currentRoom: rooms.find((room) => room.name === "Kitchen") || rooms[0],
	time: 0,
	timeLimit: 90,
	intro: [
		"Tofu-Eating Wokerati Dinner Party",
		"Your date is coming for dinner in an hour and a half, and you have decided, perhaps too ambitiously, to cook them an elaborate Ottolenghi recipe from the Guardian archives.",
		"You have a kitchen, but only some of the ingredients.",
		"Try typing 'help' for a list of commands.",
		"Good luck!",
	],
	gameOver: false,
};
