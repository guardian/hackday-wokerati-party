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
		<div
			className="font-mono flex flex-col w-full h-full overflow-y-auto px-4 py-2 border border-gray-600 rounded-lg bg-gray-900"
			ref={outputBoxRef}
		>
			{output.value.map((line, index) => {
				if (index === 0) {
					return (
						<p
							className={"text-2xl font-bold tracking-tight text-gray-300 py-2"}
						>{`${line.text}`}</p>
					);
				}

				return (
					<p
						className={`
							${line.player ? "text-white" : "text-gray-300"} py-2	
						`}
					>
						{`${line.player ? "> " : ""}${line.text}`}
					</p>
				);
			})}
			<Form onSubmit={onSubmit} />
		</div>
	);
}
