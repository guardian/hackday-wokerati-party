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
	name: ThingName;
	description: string;
	usages: Usage[];
	properties: string[];
	contents: Thing[];
	stationary: boolean;
	container: boolean;
	containedBy: Thing | null;
	cookingTimes: Partial<Record<CookedState, number>>;
	cookedState: CookedState;
	cookedFor: number;
	purchaseable: boolean;
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
	timeLimit: number;
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
	constructor(
		article: string,
		name: ThingName,
		description: string,
		purchaseable: boolean = false,
	) {
		this.article = article;
		this.name = name;
		this.description = description;
		this.properties = [];
		this.contents = [];
		this.cookingTimes = {};
		this.cookedFor = 0;
		this.container = false;
		this.purchaseable = purchaseable;
	}

	get cookedStateString(): CookedState | null {
		if (Object.keys(this.cookingTimes).length <= 0) {
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

	get propertiesString(): string {
		return this.properties?.length > 0
			? ` (${this.properties.join(", ")})`
			: "";
	}

	tick(minutes: number) {
		this.contents.forEach((thing) => thing.tick(minutes));
	}

	getFullName() {
		return `${this.article} ${this.name}${
			this.cookedStateString ? ` (${this.cookedStateString})` : ""
		}${this.describeContents()}${this.propertiesString}`;
	}

	describe() {
		state.say(
			this.description + this.describeContents() + this.propertiesString,
		);
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
		if (this.purchaseable) {
			state.say(
				"You're not a thief! Except for that one time when Mahesh and Raph made you steal a hairclip in Accessorize, but you felt really bad about that afterwards.",
			);
			return;
		}
		state.say(`You take the ${this.name}.`);
		state.inventory.push(this);
		state.currentRoom.things = state.currentRoom.things?.filter(
			(thing) => thing.name !== this.name,
		);
	}

	buy() {
		if (!this.purchaseable) {
			state.say(
				"You already own that. Congratulations! You're moving up in the world!",
			);
			return;
		}
		if (!state.inventory.find((thing) => thing.name === "wallet")) {
			state.say(
				"You don't have any money, and apparently this is set in 2013 or something so you can't pay with your phone.",
			);
			return;
		}
		state.say(`You buy the ${this.name}.`);
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

	addProperty(property: string) {
		if (this.properties?.includes(property)) {
			return;
		}
		this.properties?.push(property);
	}

	removeFromGame() {
		state.inventory = state.inventory.filter(
			(thing) => thing.name !== this.name,
		);
		state.currentRoom.things = state.currentRoom.things?.filter(
			(thing) => thing.name !== this.name,
		);
	}

	hasProperty(property: string) {
		return this.properties?.includes(property);
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
			this.removeFromGame();
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

	get topLevelContainer(): Thing {
		if (this.containedBy) {
			return this.containedBy.topLevelContainer;
		}
		return this;
	}
}

class CookableThing extends Thing {
	tick(minutes: number) {
		super.tick(minutes);
		const container = this.topLevelContainer;
		if (container instanceof Oven && container.on) {
			this.cookedFor += minutes;
			if (
				this.cookedStateString === "burnt" &&
				(state.currentRoom.name === "Kitchen" ||
					state.currentRoom.name === "Dining Room")
			) {
				state.say("An unpleasant burning smell wafts from the oven.");
			}
		}
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

type ThingName =
	| "block of tofu"
	| "cubes of tofu"
	| "garlic cloves"
	| "marinating bowl"
	| "pickling bowl"
	| "soy sauce"
	| "lime juice"
	| "red wine vinegar"
	| "fresh ginger"
	| "maple syrup"
	| "cashews"
	| "oven"
	| "wallet"
	| "sambal sauce"
	| "platter";

class TofuBlock extends CookableThing {
	private marinatedFor!: number;

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
				this.removeFromGame();
				break;
			case "dry":
				this.addProperty("dry");
				state.say("You pat the tofu dry with a paper towel. How fastidious!");
				break;
			case "cut":
				state.say("You cut the tofu into cubes.");
				this.removeFromGame();
				state.inventory.push(new TofuCubes());
				// The tofu cubes inherit all of the properties of the tofu block
				state.inventory[state.inventory.length - 1].properties =
					this.properties;
				break;
			default:
				state.say("You can't do that with the tofu.");
		}
	}

	tick(minutes: number) {
		super.tick(minutes);

		const container = this.topLevelContainer;

		if (
			container && container.contents.length > 0 &&
			container.contents.some((item) => item instanceof SoySauce)
		) {
			this.marinatedFor += minutes;
			if (this.marinatedFor >= 30) {
				this.addProperty("marinated");
			}
		}
	}
}

class TofuCubes extends CookableThing {
	private marinatedFor: number;

	constructor() {
		super(
			"some",
			"cubes of tofu",
			"Each one more perfect than the last. Euclid would be proud.",
		);
		this.cookingTimes = {
			raw: 0,
			cooked: 20,
			burnt: 40,
		};
		this.marinatedFor = 0;
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
				this.removeFromGame();
				break;
			default:
				state.say("You can't do that with the tofu cubes.");
		}
	}

	tick(minutes: number) {
		super.tick(minutes);

		const container = this.topLevelContainer;

		if (
			container && container.contents.length > 0 &&
			container.contents.some((item) => item instanceof SoySauce)
		) {
			this.marinatedFor += minutes;
			if (this.marinatedFor >= 30) {
				this.addProperty("marinated");
			}
		}
	}
}

class GarlicCloves extends Thing {
	constructor(purchaseable: boolean) {
		super("some", "garlic cloves", "They have a powerful aroma.", purchaseable);
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say("Why did you do that?");
				this.removeFromGame();
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
		super(
			"a",
			"pickling bowl",
			"It's a bowl for pickling things. Non-reactive, y'know.",
		);
		this.container = true;
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
				this.removeFromGame();
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
			case "drink":
				state.say("You're a weirdo, you know that?");
				this.removeFromGame();
				break;
			default:
				state.say("You can't do that with the lime juice.");
		}
	}
}

class Ginger extends Thing {
	private pickledFor: number;

	constructor(purchaseable: boolean) {
		super(
			"some",
			"fresh ginger",
			"A tangy, tasty, titchy tuber.",
			purchaseable,
		);
		this.pickledFor = 0;
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say("Why did you do that?");
				this.removeFromGame();
				break;
			default:
				state.say("You can't do that with the ginger.");
		}
	}

	tick(minutes: number) {
		super.tick(minutes);

		const container = this.topLevelContainer;

		console.log(container);
		console.log(container.contents);

		if (
			container && container.contents.length > 0 &&
			container.contents.some((item) => item instanceof Vinegar)
		) {
			this.pickledFor += minutes;
			if (minutes >= 20) {
				this.addProperty("pickled");
			}
		}
	}
}

class Vinegar extends Thing {
	constructor() {
		super("some", "red wine vinegar", "It's extremely sour and very organic.");
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "drink":
				state.say("You drink the vinegar, you weirdo.");
				this.removeFromGame();
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
				this.removeFromGame();
				break;
			default:
				state.say("You can't do that with the maple syrup.");
		}
	}
}

class Cashews extends CookableThing {
	constructor(purchaseable: boolean) {
		super("some", "cashews", "They're nuts.", purchaseable);
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
				state.say(
					"Delicious. Unfortunate, because you needed them, but delicious.",
				);
				this.removeFromGame();
				break;
			default:
				state.say("You can't do that with the cashews.");
		}
	}
}

interface Oven extends Thing {
	on: boolean;
	onAtTime: number;
}

class Oven extends Thing {
	constructor() {
		super(
			"an",
			"oven",
			"Raging gas burners range along the top of this top of the range range. The oven goes from 0 to 180 in under a minute, thanks to proprietary technologies which the salesperson described to you as 'lethal' and 'banned in the state of California'.",
		);
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
				state.say(
					"The oven comes to life with a patent-pending hum. Heat begins to emanate from it.",
				);
				this.on = true;
				this.onAtTime = state.time;
				break;
			case "turn off":
				state.say(
					"The oven dies down with a sad whirr. The temperature in the kitchen drops significantly.",
				);
				this.on = false;
				break;
		}
	}
}

class Wallet extends Thing {
	constructor() {
		super(
			"a",
			"wallet",
			"Chock-full of loyalty cards. When was the last time you went to Go Outdoors? Come on, be honest.",
		);
	}
}

class SambalSauce extends Thing {
	constructor(purchaseable: boolean) {
		super(
			"some",
			"sambal sauce",
			"It's got an illustration of a goose bursting into flames while fighting a dragon also bursting into flames on the label. That probably means it's hot.",
			purchaseable,
		);
	}
}

class Platter extends Thing {
	constructor() {
		super(
			"a",
			"platter",
			"A large, flat, oval platter. It's got a picture of a goose on it.",
		);
		this.container = true;
	}
}

const rooms = [
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

export const printTime = (): string => {
	const startTime = new Date(2020, 0, 1, 16, 30, 0);
	const currentTime = new Date(startTime.getTime() + state.time * 60000);
	const hours = currentTime.getHours();
	const minutes = currentTime.getMinutes();
	const timeRemaining = Math.max(state.timeLimit - state.time, 0);
	const timeString = `${hours < 10 ? "0" : ""}${hours}:${
		minutes < 10 ? "0" : ""
	}${minutes} (${timeRemaining} minutes remaining)`;
	return timeString;
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
	// The preposition can be "in" or "from" or "on"
	const subjectEndIndex = parts.indexOf("in") !== -1
		? parts.indexOf("in")
		: parts.indexOf("from") !== -1
		? parts.indexOf("from")
		: parts.indexOf("on") !== -1
		? parts.indexOf("on")
		: parts.length;
	const subject = parts.slice(0, subjectEndIndex).join(" ");

	// Get the object if present
	let object = "";
	const objectIndex = parts.indexOf("in") !== -1
		? parts.indexOf("in")
		: parts.indexOf("from") !== -1
		? parts.indexOf("from")
		: parts.indexOf("on") !== -1
		? parts.indexOf("on")
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

const findThingInGame = (name: string) => {
	const allThings: Thing[] = [];
	rooms.forEach((room) => {
		room.things.forEach((thing) => {
			allThings.push(thing);
			if (thing.container) {
				thing.contents.forEach((thing) => {
					allThings.push(thing);
				});
			}
		});
	});
	state.inventory.forEach((thing) => {
		allThings.push(thing);
		if (thing.container) {
			thing.contents.forEach((thing) => {
				allThings.push(thing);
			});
		}
	});

	return allThings.find((thing) =>
		thing.name.toLowerCase() === name.toLowerCase()
	);
};

const calculateScore = () => {
	let score = 0;
	const maxScore = 200;
	const scoreParts = [];
	// Tofu dry is worth 10 points
	// Tofu cut is worth 20 points
	// Tofu marinated is worth 30 points
	// Tofu cooked is worth 30 points
	// Tofu burnt is worth -30 points
	const tofuBlock = findThingInGame("block of tofu") as TofuBlock;
	const tofuCubes = findThingInGame("cubes of tofu") as TofuCubes;
	if (tofuCubes) {
		score += 10;
		scoreParts.push({ name: "Tofu cut", score: 10 });
	}
	if (
		tofuBlock?.hasProperty("marinated") || tofuCubes?.hasProperty("marinated")
	) {
		score += 30;
		scoreParts.push({ name: "Tofu marinated", score: 30 });
	}
	if (tofuBlock?.hasProperty("dry") || tofuCubes?.hasProperty("dry")) {
		score += 10;
		scoreParts.push({ name: "Tofu dried", score: 10 });
	}
	if (
		tofuBlock?.cookedStateString === "cooked" ||
		tofuCubes?.cookedStateString === "cooked"
	) {
		score += 30;
		scoreParts.push({ name: "Tofu cooked", score: 30 });
	}
	if (
		tofuBlock?.cookedStateString === "burnt" ||
		tofuCubes?.cookedStateString === "burnt"
	) {
		score -= 30;
		scoreParts.push({ name: "Tofu burnt", score: -30 });
	}
	// Cashews cooked are worth 30 points
	// Cashews burnt are worth -30 points
	const cashews = findThingInGame("cashews") as Cashews;
	if (cashews.cookedStateString === "cooked") {
		score += 30;
		scoreParts.push({ name: "Cashews cooked", score: 30 });
	}
	if (cashews.cookedStateString === "burnt") {
		score -= 30;
		scoreParts.push({ name: "Cashews burnt", score: -30 });
	}
	// Ginger pickled is worth 30 points
	const ginger = findThingInGame("fresh ginger") as Ginger;
	if (ginger.hasProperty("pickled")) {
		score += 30;
		scoreParts.push({ name: "Ginger pickled", score: 30 });
	}
	// Sambal on platter is worth 15 points
	const sambal = findThingInGame("sambal sauce") as SambalSauce;
	if (sambal.containedBy?.name === "platter") {
		score += 15;
		scoreParts.push({ name: "Sambal on platter", score: 15 });
	}
	// Tofu on platter is worth 15 points
	if (
		tofuBlock?.containedBy?.name === "platter" ||
		tofuCubes?.containedBy?.name === "platter"
	) {
		score += 15;
		scoreParts.push({ name: "Tofu on platter", score: 15 });
	}
	// Cashews on platter is worth 15 points
	if (cashews?.containedBy?.name === "platter") {
		score += 15;
		scoreParts.push({ name: "Cashews on platter", score: 15 });
	}
	// Ginger on platter is worth 15 points
	if (ginger?.containedBy?.name === "platter") {
		score += 15;
		scoreParts.push({ name: "Ginger on platter", score: 15 });
	}

	return {
		score: score,
		maxScore: maxScore,
		scoreParts: scoreParts,
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
			say(
				`Available commands are: look, time, examine, go, take, drop, buy, wait, inventory, ${
					verbs.join(", ")
				}.`,
			);
			break;
		case "time":
			say(printTime());
			break;
		case "look":
			if (args.length === 0) {
				say(state.currentRoom?.name);
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
		case "examine": {
			const thing = args.join(" ");
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
				say("Examine what?");
			}
			break;
		}
		case "go": {
			const direction = args.filter((arg) => arg !== "to").join(" ");
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
		case "buy": {
			const thing = args.join(" ");
			if (thing) {
				const thingExists = state.currentRoom?.things?.find((roomThing) =>
					roomThing.name.toLowerCase().includes(thing.toLowerCase())
				);
				if (thingExists) {
					thingExists.buy();
					tick();
				} else {
					say(`You can't buy that.`);
				}
			} else {
				say("Buy what?");
			}
			break;
		}
		case "wait": {
			const minutes = parseInt(args[0]);
			if (minutes) {
				tick(minutes);
				say("Time passes.");
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
			console.log(state);
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
	if (state.time >= state.timeLimit && !state.gameOver) {
		state.say(
			"It's 6pm, and your date is due to arrive! Let's see how you did...",
		);
		const { score, maxScore, scoreParts } = calculateScore();
		state.say(`You scored ${score} out of ${maxScore} points.`);
		if (score >= maxScore * 0.8) {
			state.say(
				"Your date was hugely impressed. Even Ottolenghi would be proud of your cooking skills. In fact, your date is so impressed that next time they come round, they invite Ottolenghi to join you. You all have the greatest dinner party of all time. It goes down in the annals of history. Tragically, your date and Ottolenghi then get together, but they seem really happy, so you can't get too mad about it.",
			);
		} else if (score >= maxScore * 0.5) {
			state.say(
				"The recipe didn't quite go to plan. Perhaps you were too ambitious. Next time, your date specifically asks you to let them cook instead. It turns out they're much better at it than you are, and you have a lovely evening together. The thought of what could have been slowly eats away at you, but you try not to think about it too much. You're happy for them, really.",
			);
		} else {
			state.say(
				"'Well,' says your date after two forkfuls. 'Astonishingly, that's actually the worst thing I've ever eaten'. You try to explain that it's not your fault, but they're already out the door. You're left alone with the remains of your truly disastrous meal, and a deep sense of shame. You never cook again.",
			);
		}
		state.say("Score breakdown:");
		for (const { name, score } of scoreParts) {
			state.say(`${name}: ${score}`);
		}
		state.gameOver = true;
		return;
	}
};
