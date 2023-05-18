import { useState } from "preact/hooks";

interface FormProps {
	onSubmit: (inputText: string) => void;
}

export default function Form({ onSubmit }: FormProps) {
	const [inputText, setInputText] = useState("");

	return (
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
				value={inputText.toLocaleLowerCase()}
				onInput={(e) => setInputText(e.currentTarget.value.toLowerCase())}
				className="flex-grow bg-transparent focus:outline-none text-white border-b border-gray-700"
				placeholder={"What do you do?"}
			/>
			<button
				className="text-mono px-4 py-2 ml-2 text-white bg-transparent rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700"
				type="submit"
			>
				Submit
			</button>
		</form>
	);
}
