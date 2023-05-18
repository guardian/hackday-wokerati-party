import { signal } from "@preact/signals";
import Form from "../components/Form.tsx";
import { parse, printTime } from "../lib/game.ts";
import { state } from "../lib/state.ts";
import { useEffect, useRef } from "preact/hooks";

interface Message {
	player: boolean;
	text: string;
}

const output = signal<Message[]>(
	state.intro.map((line) => ({ player: false, text: line })) as Message[]
);

const add = (message: Message) => {
	output.value = [...output.value, message];
};

const say = (text: string) => {
	add({ player: false, text: text });
};

const onSubmit = (text: string) => {
	add({ player: true, text: text });
	parse(text, say);
};

interface GameProps {
	setShowRecipe: (showRecipe: boolean) => void;
}

export default function Game({ setShowRecipe }: GameProps) {
	const outputBoxRef = useRef<HTMLDivElement>(null);
	const inputFieldRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (outputBoxRef.current) {
			// scroll to bottom of output box
			outputBoxRef.current.scrollTop = outputBoxRef.current.scrollHeight;
		}
	}, [output.value]);

	useEffect(() => {
		if (inputFieldRef.current) {
			inputFieldRef.current.focus();
		}
	}, []);

	return (
		<div
			className="font-mono flex flex-col w-full h-full overflow-y-auto px-4 py-2 border border-gray-600 rounded-lg bg-gray-900"
			ref={outputBoxRef}
		>
			{output.value.map((line, index) => {
				if (index === 0) {
					return (
						<h1
							className={"text-2xl font-bold tracking-tight text-gray-300 py-2"}
						>{`${line.text}`}</h1>
					);
				}

				return (
					<p
						className={`
							${line.player ? "text-white font-semibold" : "text-gray-300"} py-2	
						`}
					>
						{`${line.player ? `${printTime()} > ` : ""}${line.text}`}
					</p>
				);
			})}
			<Form onSubmit={onSubmit} inputFieldRef={inputFieldRef} />
			<button
				className="text-mono px-4 py-2 ml-2 text-white rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 my-4 lg:hidden"
				onClick={() => setShowRecipe(true)}
			>
				Show Recipe
			</button>
		</div>
	);
}
