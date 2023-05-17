import { Head } from "$fresh/runtime.ts";
import Game from "../islands/Game.tsx";

export default function Home() {
	return (
		<>
			<Head>
				<title>Tofu-eating wokerati dinner party</title>
			</Head>

			<div className="w-full bg-gray-800">
				<div class="p-4 mx-auto max-w-screen-md h-screen">
					<Game />
				</div>
			</div>
		</>
	);
}
