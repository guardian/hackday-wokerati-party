import {
	Cashews,
	Ginger,
	SambalSauce,
	Thing,
	TofuBlock,
	TofuCubes,
} from "./thing.ts";
import { rooms, state } from "./state.ts";

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

export type Verb = (typeof verbs)[number];

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
	const verb = (text.match(verbsRegex)?.[0] || "") as Verb;
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
			thing.contents.forEach((thing: Thing) => {
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
					const thingExists =
						state.currentRoom?.things?.find((roomThing: Thing) =>
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
				const thingExists =
					state.currentRoom?.things?.find((roomThing: Thing) =>
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
				const newRoom = state.currentRoom?.exits.find((exit: string) =>
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
				const thingExists = state.currentRoom?.things?.find((
					roomThing: Thing,
				) => roomThing.name.toLowerCase().includes(thing.toLowerCase()));
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
				const thingExists = state.currentRoom?.things?.find((
					roomThing: Thing,
				) => roomThing.name.toLowerCase().includes(thing.toLowerCase()));
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
		case "kill":
			if (args[0] === "jester") {
				say("Jingle is dead. Game over.");
				state.gameOver = true;
			} else {
				say("You can't kill that.");
			}
			break;
		default: {
			// If the command isn't a built-in command, check if it's a usage
			// Usage syntax is: <verb> <subject> [in|from <object>]
			// Parse the command to get the verb, subject, and object
			// The subject and object can be any number of words
			const { verb, subject, object } = parseUsage(input);
			console.log({ verb, subject, object });

			// Is this a valid verb?
			const verbExists = verbs.find((v) => v === verb);
			if (!verbExists) {
				say(`I don't know how to do that.`);
				break;
			}

			// Is there a subject?
			if (!subject) {
				say(`What do you want to ${verb}?`);
				break;
			}

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
