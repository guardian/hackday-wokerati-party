import { Verb } from "./game.ts";
import { state } from "./state.ts";

export interface Thing {
	article: string;
	name: ThingName;
	description: string;
	properties: string[];
	contents: Thing[];
	stationary: boolean;
	container: boolean;
	containedBy: Thing | null;
	cookingTimes: Partial<Record<CookedState, number>>;
	cookedState: CookedState;
	cookedFor: number;
	purchaseable: boolean;
	allowedVerbs: Verb[];
}

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

type CookedState = "raw" | "cooked" | "burnt";

const doGameOver = () => {
	state.say("Game over.");
	state.gameOver = true;
};

export class Thing {
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
		this.allowedVerbs = ["put", "remove"];
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

	use(verb: Verb, object?: Thing): boolean | void {
		if (this.allowedVerbs?.includes(verb) === false) {
			state.say(`You can't ${verb} the ${this.name}.`);
			return true;
		}
		switch (verb) {
			case "put":
				if (object) {
					this.putIn(object);
				} else {
					state.say(`Put the ${this.name} in what?`);
				}
				return true;
			case "remove":
				if (this.containedBy) {
					this.removeFromCurrentContainer();
				} else {
					state.say(`The ${this.name} isn't inside anything.`);
				}
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

export class CookableThing extends Thing {
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

export class TofuBlock extends CookableThing {
	private marinatedFor!: number;

	constructor() {
		super("a", "block of tofu", "It's extra-firm. It wobbles imperceptibly.");
		this.cookingTimes = {
			raw: 0,
			cooked: 30,
			burnt: 60,
		};
		this.allowedVerbs = ["put", "remove", "eat", "dry", "cut"];
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

export class TofuCubes extends CookableThing {
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
		this.allowedVerbs = ["put", "remove", "eat"];
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

export class GarlicCloves extends Thing {
	constructor(purchaseable: boolean) {
		super("some", "garlic cloves", "They have a powerful aroma.", purchaseable);
		this.allowedVerbs = ["put", "remove", "eat"];
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
		}
	}
}

export class MarinatingBowl extends Thing {
	constructor() {
		super(
			"a",
			"marinating bowl",
			"When your grandmother gave you this bowl, she made it explicitly clear that it was to be used exclusively for marinating things. Weird, but there you go.",
		);
		this.container = true;
	}
}

export class PicklingBowl extends Thing {
	constructor() {
		super(
			"a",
			"pickling bowl",
			"It's a bowl for pickling things. Non-reactive, y'know.",
		);
		this.container = true;
	}
}

export class SoySauce extends Thing {
	constructor() {
		super("some", "soy sauce", "Salty.");
		this.allowedVerbs = ["put", "remove", "drink"];
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "drink":
				state.say(
					"You drink the soy sauce. It's the saltiest thing you've ever ingested. You feel slightly nauseous.",
				);
				this.removeFromGame();
				break;
		}
	}
}

export class LimeJuice extends Thing {
	constructor() {
		super("some", "lime juice", "It's sour.");
		this.allowedVerbs = ["put", "remove", "drink"];
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
		}
	}
}

export class Ginger extends Thing {
	private pickledFor: number;

	constructor(purchaseable: boolean) {
		super(
			"some",
			"fresh ginger",
			"A tangy, tasty, titchy tuber.",
			purchaseable,
		);
		this.pickledFor = 0;
		this.allowedVerbs = ["put", "remove", "eat"];
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

export class Vinegar extends Thing {
	constructor() {
		super("some", "red wine vinegar", "It's extremely sour and very organic.");
		this.allowedVerbs = ["put", "remove", "drink"];
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
		}
	}
}

export class MapleSyrup extends Thing {
	constructor() {
		super(
			"some",
			"maple syrup",
			"It glistens invitingly in its dinky bottle. 'I'm delicious and made solely of naturally occurring sugars,' it whispers. 'Drink me with a straw!'.",
		);
		this.allowedVerbs = ["put", "remove", "drink"];
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
		}
	}
}

export class Cashews extends CookableThing {
	constructor(purchaseable: boolean) {
		super("some", "cashews", "They're nuts.", purchaseable);
		this.cookedFor = 0;
		this.cookingTimes = {
			raw: 0,
			cooked: 12,
			burnt: 18,
		};
		this.allowedVerbs = ["put", "remove", "eat"];
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
		}
	}
}

export interface Oven extends Thing {
	on: boolean;
	onAtTime: number;
}

export class Oven extends Thing {
	constructor() {
		super(
			"an",
			"oven",
			"Raging gas burners range along the top of this top of the range range. The oven goes from 0 to 180 in under a minute, thanks to proprietary technologies which the salesperson described to you as 'lethal' and 'banned in the state of California'.",
		);
		this.on = false;
		this.stationary = true;
		this.container = true;
		this.allowedVerbs = ["put", "remove", "turn on", "turn off", "eat"];
	}

	getFullName(): string {
		if (this.on) {
			return "an oven (on)" + this.describeContents();
		} else {
			return "an oven (off)" + this.describeContents();
		}
	}

	use(verb: Verb, object?: Thing) {
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

export class Wallet extends Thing {
	constructor() {
		super(
			"a",
			"wallet",
			"Chock-full of loyalty cards. When was the last time you went to Go Outdoors? Come on, be honest.",
		);
	}
}

export class SambalSauce extends Thing {
	constructor(purchaseable: boolean) {
		super(
			"some",
			"sambal sauce",
			"It's got an illustration of a goose bursting into flames while fighting a dragon also bursting into flames on the label. That probably means it's hot.",
			purchaseable,
		);
		this.allowedVerbs = ["put", "remove", "eat"];
	}

	use(verb: Verb, object?: Thing) {
		const used = super.use(verb, object);
		if (used) {
			return;
		}
		switch (verb) {
			case "eat":
				state.say("AUGHHHHHHHHHHHHHHH");
				this.removeFromGame();
				break;
		}
	}
}

export class Platter extends Thing {
	constructor() {
		super(
			"a",
			"platter",
			"A large, flat, oval platter. It's got a picture of a goose on it.",
		);
		this.container = true;
	}
}
