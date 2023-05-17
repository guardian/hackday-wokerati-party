import { signal } from "@preact/signals";
import Form from "../components/Form.tsx";
import { parse, state } from "../lib/game.ts";
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

export default function Game() {
	const outputBoxRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (outputBoxRef.current) {
			// scroll to bottom of output box
			outputBoxRef.current.scrollTop = outputBoxRef.current.scrollHeight;
		}
	}, [output.value]);

	return (
		<div className="container mx-auto h-full">
			<div className="mt-4 h-5/6">
				<div
					className="font-mono flex flex-col w-full h-full overflow-y-auto px-4 py-2 mt-2 border border-gray-300 rounded-lg bg-black"
					ref={outputBoxRef}
				>
					{output.value.map((line, index) => (
						<p
							className={`
              ${line.player ? "text-white" : "text-gray-300"}
            `}
						>
							{`${line.player ? "> " : ""}${line.text}`}
						</p>
					))}
				</div>
			</div>
			<Form onSubmit={onSubmit} />
		</div>
	);
}
