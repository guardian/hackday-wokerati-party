type Exit = string;

interface Room {
	name: string;
	description: string;
	exits: Exit[];
	things: Thing[];
}

type CookedState = "raw" | "cooked" | "burnt";

interface Thing {
	article: string;
	name: string;
	description: string;
	usages: Usage[];
	properties?: Property[];
	contents: Thing[];
	stationary: boolean;
	container: boolean;
	containedBy: Thing | null;
	cookingTimes: Partial<Record<CookedState, number>>;
	cookedState: CookedState;
	cookedFor: number;
}

interface Property {
	name: string;
	value: string;
}

interface Usage {
	verb: string;
	object?: string;
	outcome: () => void;
}

interface State {
	say: (message: string) => void;
	gameOver: boolean;
	inventory: Thing[];
	currentRoom: Room;
	time: number;
	usages?: Usage[];
	intro: string[];
}

const doGameOver = () => {
	state.say("Game over.");
	state.gameOver = true;
};

class Room {
	constructor(
		name: string,
		description: string,
		exits: Exit[] = [],
		things: Thing[] = [],
	) {
		this.name = name;
		this.description = description;
		this.exits = exits;
		this.things = things;
	}

	addExit(exit: Exit) {
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

class Thing {
	constructor(article: string, name: string, description: string) {
		this.article = article;
		this.name = name;
		this.description = description;
		this.properties = [];
		this.contents = [];
		this.cookingTimes = {};
		this.cookedFor = 0;
		this.container = false;
	}

	get cookedStateString(): CookedState | null {
		if (Object.keys(this.cookingTimes).length <= 3) {
			return null;
		}
		if (
			this.cookingTimes.cooked &&
			this.cookedFor < this.cookingTimes?.cooked
		) {
			return "raw";
		} else if (
			this.cookingTimes.burnt &&
			this.cookedFor < this.cookingTimes?.burnt
		) {
			return "cooked";
		} else {
			return "burnt";
		}
	}

	tick(minutes: number) {
		this.contents.forEach((thing) => thing.tick(minutes));
	}

	getFullName() {
		return `${this.article} ${this.name}${
			this.cookedStateString ? ` (${this.cookedStateString})` : ""
		}${this.describeContents()}`;
	}

	describe() {
		state.say(this.description + this.describeContents());
	}

	describeContents(): string {
		if (this.contents.length > 0) {
			return ` (containing: ${
				this.contents
					?.map((thing) => thing.getFullName())
					.join(", ")
			})`;
		} else {
			return "";
		}
	}

	take() {
		if (this.stationary) {
			state.say(`The ${this.name} is too heavy to pick up.`);
			return;
		}
		state.say(`You take the ${this.name}.`);
		state.inventory.push(this);
		state.currentRoom.things = state.currentRoom.things?.filter(
			(thing) => thing.name !== this.name,
		);
	}

	drop() {
		state.say(`You drop the ${this.name}.`);
		state.currentRoom.things?.push(this);
		state.inventory = state.inventory.filter(
			(thing) => thing.name !== this.name,
		);
	}

	addProperty(property: Property) {
		this.properties?.push(property);
	}

	removeFromInventory() {
		state.inventory = state.inventory.filter(
			(thing) => thing.name !== this.name,
		);
	}

	hasProperty(property: string) {
		return this.properties?.find((prop) => prop.name === property);
	}

	addContents(thing: Thing) {
		this.contents?.push(thing);
	}

	removeContents(thing: Thing) {
		this.contents = this.contents.filter((item) => item.name !== thing.name);
		state.inventory.push(thing);
	}

	putIn(container: Thing) {
		// Check if the thing is in the inventory
		if (!state.inventory.find((item) => item.name === this.name)) {
			state.say("You aren't carrying that.");
			return;
		}
		// Check if the container is in the inventory or the room
		if (
			state.inventory.find((item) => item.name === container.name) ||
			state.currentRoom.findThing(container.name)
		) {
			if (container.container === false) {
				state.say(`You can't put things in the ${container.name}.`);
				return;
			}
			if (this === container) {
				state.say(
					`You put the ${this.name} in itself. The universe gently explodes around you.`,
				);
				doGameOver();
				return;
			}
			container.addContents(this);
			this.containedBy = container;
			this.removeFromInventory();
			state.say(`You put the ${this.name} in the ${container.name}.`);
		} else {
			state.say("You can't see that here.");
		}

		if (container instanceof Oven && container.on === false) {
			state.say("You know the oven is off, right?");
		}
	}

	removeFromCurrentContainer() {
		if (this.containedBy) {
			this.containedBy.removeContents(this);
			state.say(
				`You take the ${this.name} out of the ${this.containedBy.name}.`,
			);
			this.containedBy = null;
		}
	}

	use(verb: string, object?: Thing): boolean | void {
		switch (verb) {
			case "put":
				if (object) {
					this.putIn(object);
				}
				return true;
			case "remove":
				this.removeFromCurrentContainer();
				return true;
			default:
				return false;
		}
	}

	// Recursively look for a thing among the things in the room and the things they contain
	findInContents(thing: string): Thing | null {
		const found = this.contents?.find((item) => item.name.includes(thing));
		if (found) {
			return found;
		}
		for (const item of this.contents) {
			const foundInContents = item.findInContents(thing);
			if (foundInContents) {
				return foundInContents;
			}
		}
		return null;
	}
}

const verbs = [
	"eat",
	"drink",
	"dry",
	"cut",
	"put",
	"turn on",
	"turn off",
	"remove",
] as const;

type Verb = (typeof verbs)[number];

class TofuBlock extends Thing {
	constructor() {
		super("a", "block of tofu", "It's extra-firm. It wobbles imperceptibly.");
		this.cookingTimes = {
			raw: 0,
			cooked: 30,
			burnt: 60,
		};
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say(
					"You put the whole block of raw tofu in your mouth. It's bland and vast.",
				);
				this.removeFromInventory();
				break;
			case "dry":
				this.addProperty({ name: "dry", value: "true" });
				state.say("You pat the tofu dry with a paper towel. How fastidious!");
				break;
			case "cut":
				state.say("You cut the tofu into cubes.");
				this.removeFromInventory();
				state.inventory.push(new TofuCubes());
				break;
			default:
				state.say("You can't do that with the tofu.");
		}
	}

	tick(minutes: number) {
		super.tick(minutes);
		if (
			(this.containedBy instanceof Oven && this.containedBy.on) ||
			(this.containedBy?.containedBy instanceof Oven &&
				this.containedBy.containedBy?.on)
		) {
			this.cookedFor += minutes;
		}
	}
}

class TofuCubes extends Thing {
	constructor() {
		super(
			"some",
			"cubes of tofu",
			"They're small cubes of tofu. They wobble imperceptibly.",
		);
		this.cookingTimes = {
			raw: 0,
			cooked: 20,
			burnt: 40,
		};
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say(
					"You snack on the cubes of tofu. They're okay. You're not sure what you expected.",
				);
				this.removeFromInventory();
				break;
			default:
				state.say("You can't do that with the tofu cubes.");
		}
	}

	tick(minutes: number) {
		super.tick(minutes);
		if (
			(this.containedBy instanceof Oven && this.containedBy.on) ||
			(this.containedBy?.containedBy instanceof Oven &&
				this.containedBy.containedBy?.on)
		) {
			this.cookedFor += minutes;
		}
	}
}

class SmallSaucepan extends Thing {
	constructor() {
		super("a", "small saucepan", "It's a small saucepan.");
		this.container = true;
	}
}

class GarlicCloves extends Thing {
	constructor() {
		super("some", "garlic cloves", "They have a powerful aroma.");
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say("Why did you do that?");
				this.removeFromInventory();
				break;
			default:
				state.say("You can't do that with the garlic cloves.");
		}
	}
}

class MarinatingBowl extends Thing {
	constructor() {
		super(
			"a",
			"marinating bowl",
			"When your grandmother gave you this bowl, she made it explicitly clear that it was to be used exclusively for marinating things. Weird, but there you go.",
		);
		this.container = true;
	}
}

class PicklingBowl extends Thing {
	constructor() {
		super("a", "pickling bowl", "It's a bowl for pickling things.");
		this.container = true;
	}
}

class SmallTray extends Thing {
	constructor() {
		super("a", "small tray", "Good for putting in the oven.");
		this.container = true;
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			default:
				state.say("You can't do that with the small oven tray.");
		}
	}
}

class SoySauce extends Thing {
	constructor() {
		super("some", "soy sauce", "Salty.");
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say("You drink the soy sauce. It's salty.");
				this.removeFromInventory();
				break;
			default:
				state.say("You can't do that with the soy sauce.");
		}
	}
}

class LimeJuice extends Thing {
	constructor() {
		super("some", "lime juice", "It's sour.");
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say("You're a weirdo, you know that?");
				this.removeFromInventory();
				break;
			default:
				state.say("You can't do that with the lime juice.");
		}
	}
}

class Ginger extends Thing {
	constructor() {
		super("some", "fresh ginger", "It's a root. It's spicy.");
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say("Why did you do that?");
				this.removeFromInventory();
				break;
			default:
				state.say("You can't do that with the ginger.");
		}
	}
}

class Vinegar extends Thing {
	constructor() {
		super("some", "white vinegar", "It's sour.");
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say("You drink the vinegar. It's sour.");
				this.removeFromInventory();
				break;
			default:
				state.say("You can't do that with the vinegar.");
		}
	}
}

class MapleSyrup extends Thing {
	constructor() {
		super(
			"some",
			"maple syrup",
			"It glistens invitingly in its dinky bottle. 'I'm delicious and made solely of naturally occurring sugars,' it whispers. 'Drink me with a straw!'.",
		);
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "drink":
				state.say("You drink the maple syrup. It's distressingly sweet.");
				this.removeFromInventory();
				break;
			default:
				state.say("You can't do that with the maple syrup.");
		}
	}
}

class Cashews extends Thing {
	constructor() {
		super("some", "cashews", "They're nuts.");
		this.cookedFor = 0;
		this.cookingTimes = {
			raw: 0,
			cooked: 12,
			burnt: 18,
		};
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say("Delicious.");
				this.removeFromInventory();
				break;
			default:
				state.say("You can't do that with the cashews.");
		}
	}

	tick(minutes: number) {
		super.tick(minutes);
		if (
			(this.containedBy instanceof Oven && this.containedBy.on) ||
			(this.containedBy?.containedBy instanceof Oven &&
				this.containedBy.containedBy?.on)
		) {
			this.cookedFor += minutes;
		}
	}
}

interface Oven extends Thing {
	on: boolean;
	onAtTime: number;
}

class Oven extends Thing {
	constructor() {
		super("an", "oven", "It's an oven.");
		this.on = false;
		this.stationary = true;
		this.container = true;
	}

	getFullName(): string {
		if (this.on) {
			return "an oven (on)" + this.describeContents();
		} else {
			return "an oven (off)" + this.describeContents();
		}
	}

	use(verb: string, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say(
					"You break your teeth. This is because you tried to eat an oven.",
				);
				break;
			case "turn on":
				state.say("You turn on the oven.");
				this.on = true;
				this.onAtTime = state.time;
				break;
			case "turn off":
				state.say("You turn off the oven.");
				this.on = false;
				break;
		}
	}
}

const rooms = [
	new Room(
		"Kitchen",
		"You are in a kitchen.",
		["dining room"],
		[
			new Oven(),
			new TofuBlock(),
			new SmallSaucepan(),
			new MarinatingBowl(),
			new PicklingBowl(),
			new SmallTray(),
			new SoySauce(),
			new LimeJuice(),
			new GarlicCloves(),
			new Ginger(),
			new Vinegar(),
			new MapleSyrup(),
			new Cashews(),
		],
	),
	new Room("Dining Room", "You are in a dining room.", ["kitchen", "hall"]),
	new Room("Hall", "You are in a hall.", ["dining room", "high street"]),
	new Room("High Street", "You are on the high street.", [
		"hall",
		"supermarket",
		"greengrocer",
	]),
	new Room("Supermarket", "You are in a supermarket.", ["high street"]),
	new Room("Greengrocer", "You are in a greengrocer.", ["high street"]),
];

export const state: State = {
	say: (text) => console.log(text),
	inventory: [],
	currentRoom: rooms.find((room) => room.name === "Kitchen") || rooms[0],
	time: 0,
	intro: [
		"Tofu-Eating Wokerati Dinner Party",
		"Your date is coming for dinner in three hours, and you have decided, perhaps too ambitiously, to cook them an elaborate Ottolenghi recipe from the Guardian archives.",
		"You have a kitchen, but only some of the ingredients. You have a few hours to prepare.",
		"You can use commands like 'look', 'take', 'put', 'eat', 'turn on', 'turn off', 'go', 'inventory', 'time', and 'help'.",
		"Good luck!",
	],
	gameOver: false,
};

const printTime = () => {
	const startTime = new Date(2020, 0, 1, 15, 0, 0);
	const currentTime = new Date(startTime.getTime() + state.time * 60000);
	const hours = currentTime.getHours();
	const minutes = currentTime.getMinutes();
	const timeString = `${hours < 10 ? "0" : ""}${hours}:${
		minutes < 10 ? "0" : ""
	}${minutes}`;
	state.say(`The time is ${timeString}.`);
};

const tick = (minutes = 1) => {
	state.time += minutes;

	// Tick every Thing in every Room (which ticks all of that thing's contents, too)
	rooms.forEach((room) => {
		room.things.forEach((thing) => {
			thing.tick(minutes);
		});
	});
	state.inventory.forEach((thing) => {
		thing.tick(minutes);
	});
};

const parseUsage = (text: string) => {
	const verbsRegex = new RegExp("^" + verbs.join("|"), "i");
	const verb = text.match(verbsRegex)?.[0] || "";
	const textWithoutVerb = text.replace(verbsRegex, "").trim();

	const parts = textWithoutVerb.split(" ");

	// Get the subject
	// The preposition can be "in" or "from"
	const subjectEndIndex = parts.indexOf("in") !== -1
		? parts.indexOf("in")
		: parts.indexOf("from") !== -1
		? parts.indexOf("from")
		: parts.length;
	const subject = parts.slice(0, subjectEndIndex).join(" ");

	// Get the object if present
	let object = "";
	const objectIndex = parts.indexOf("in") !== -1
		? parts.indexOf("in")
		: parts.indexOf("from") !== -1
		? parts.indexOf("from")
		: parts.length;
	if (objectIndex !== -1 && objectIndex + 1 < parts.length) {
		object = parts.slice(objectIndex + 1).join(" ");
	}

	return {
		verb: verb,
		subject: subject,
		object: object,
	};
};

export const parse = (input = "", say: (output: string) => void) => {
	const [command, ...args] = input.split(" ");
	state.say = say;

	if (state.gameOver) {
		state.say("The game is over. You've had your fun, now let me nap.");
		return;
	}

	switch (command) {
		case "help":
			say("There is no helping you.");
			break;
		case "time":
			printTime();
			break;
		case "look":
			if (args.length === 0) {
				state.currentRoom?.describe();
				tick();
			} else if (args[0] === "at") {
				const thing = args.slice(1).join(" ");
				if (thing) {
					const thingExists = state.currentRoom?.things?.find((roomThing) =>
						roomThing.name.toLowerCase().includes(thing.toLowerCase())
					) ||
						state.inventory.find((inventoryThing) =>
							inventoryThing.name.toLowerCase().includes(thing.toLowerCase())
						);
					if (thingExists) {
						thingExists.describe();
						tick();
					} else {
						say(`You can't see that.`);
					}
				} else {
					say("Look at what?");
				}
			} else {
				say("Look where?");
			}
			break;
		case "go": {
			const direction = args.join(" ");
			if (direction) {
				const newRoom = state.currentRoom?.exits.find((exit) =>
					exit.toLowerCase().includes(direction.toLowerCase())
				);
				if (newRoom) {
					const roomExists = rooms.find(
						(room) => room.name.toLowerCase() === newRoom.toLowerCase(),
					);
					if (!roomExists) {
						say(`You can't go that way.`);
						break;
					}
					say(`You go to the ${newRoom}...`);
					state.currentRoom = roomExists;
					state.currentRoom?.describe();
					tick();
				} else {
					say(`You can't go that way.`);
				}
			} else {
				say("Go where?");
			}
			break;
		}
		case "take": {
			const thing = args.join(" ");
			if (thing) {
				const thingExists = state.currentRoom?.things?.find((roomThing) =>
					roomThing.name.toLowerCase().includes(thing.toLowerCase())
				);
				if (thingExists) {
					thingExists.take();
					tick();
				} else {
					say(`You can't take that.`);
				}
			} else {
				say("Take what?");
			}
			break;
		}
		case "drop": {
			const thing = args.join(" ");
			if (thing) {
				const thingExists = state.inventory.find((inventoryThing) =>
					inventoryThing.name.toLowerCase().includes(thing.toLowerCase())
				);
				if (thingExists) {
					thingExists.drop();
					tick();
				} else {
					say(`You can't drop that.`);
				}
			} else {
				say("Drop what?");
			}
			break;
		}
		case "wait": {
			const minutes = parseInt(args[0]);
			if (minutes) {
				tick(minutes);
			} else {
				say("Wait for how many minutes?");
			}
			break;
		}
		case "inventory":
			if (state.inventory.length > 0) {
				say(
					"You're carrying: " +
						state.inventory.map((thing) => thing.getFullName()).join(", "),
				);
			} else {
				say("You're carrying nothing.");
			}
			break;
		case "state":
			say(JSON.stringify(state, null, 2));
			break;
		default: {
			// If the command isn't a built-in command, check if it's a usage
			// Usage syntax is: <verb> <subject> [in|from <object>]
			// Parse the command to get the verb, subject, and object
			// The subject and object can be any number of words
			const { verb, subject, object } = parseUsage(input);
			console.log({ verb, subject, object });

			// Is there a thing in our inventory that matches the subject?
			const thingInInventory = state.inventory.find((thing) =>
				thing.name.toLowerCase().includes(subject.toLowerCase())
			);
			const thingInRoom = state.currentRoom?.findThing(subject);

			const thingToUse = thingInInventory || thingInRoom;

			if (thingToUse) {
				// If there is an object, does it exist in our inventory or the current room?
				if (object) {
					const objectInInventory = state.inventory.find((thing) =>
						thing.name.toLowerCase().includes(object.toLowerCase())
					);
					console.log("objectInInventory", objectInInventory);
					// We need to check the current room for the object recursively,
					// because it could be inside another thing in the room.
					const objectInRoom = state.currentRoom?.findThing(object);
					console.log("objectInRoom", objectInRoom);
					if (objectInInventory) {
						thingToUse.use(verb, objectInInventory);
						tick();
					} else if (objectInRoom) {
						thingToUse.use(verb, objectInRoom);
						tick();
					} else {
						say(`You can't do that.`);
					}
				} else {
					thingToUse.use(verb);
					tick();
				}
				break;
			} else {
				// // If the thing isn't in our inventory, is it in the current room?
				// const thingInRoom = state.currentRoom?.findThing(subject);
				// console.log("thingInRoom", thingInRoom);
				// if (thingInRoom) {
				// 	// Is the thing stationary?
				// 	if (thingInRoom.stationary) {
				// 		// Cheat: move the thing to the inventory, use it, then move it back
				// 		state.inventory.push(thingInRoom);
				// 		thingInRoom.use(verb);
				// 		state.inventory.pop();
				// 	} else {
				// 		say("You aren't carrying that.");
				// 	}
				// 	break;
				// }
				say("You can't do that.");
			}
		}
	}
};
