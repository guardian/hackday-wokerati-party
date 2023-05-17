import { useState } from "preact/hooks";

interface FormProps {
	onSubmit: (inputText: string) => void;
}

export default function Form({ onSubmit }: FormProps) {
	const [inputText, setInputText] = useState("");

	return (
		<div className="mt-4 font-mono h-1/6">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					onSubmit(inputText);
					setInputText("");
				}}
				className="flex flex-row justify-between w-full"
			>
				<input
					type="text"
					value={inputText}
					onInput={(e) => setInputText(e.currentTarget.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 font-mono"
					placeholder="What do you do?"
				/>
				<button
					className="text-mono px-4 py-2 ml-2 text-white bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
					type="submit"
				>
					Submit
				</button>
			</form>
		</div>
	);
}
