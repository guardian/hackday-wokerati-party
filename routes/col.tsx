import { Head } from "$fresh/runtime.ts";
import Game from "../islands/Game.tsx";
import Recipe from "../islands/Recipe.tsx";

export default function Col() {
	return (
		<>
			<Head>
				<title>Tofu-eating wokerati dinner party</title>
			</Head>

			<div className="w-full">
				<div class="container mx-auto h-screen">
					<div class="grid grid-cols-1 gap-4 h-full lg:grid-cols-2 ">
						<div class="p-4 max-h-screen">
							<Game />
						</div>
						<div class="p-4 max-h-screen">
							<Recipe />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
