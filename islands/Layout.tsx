import Game from "./Game.tsx";
import Recipe from "./Recipe.tsx";
import { useState } from "preact/hooks";

export default function Layout() {
	const [showRecipe, setShowRecipe] = useState(false);

	return (
		<>
			<div className="w-full">
				<div class="container mx-auto h-screen">
					<div class="grid grid-cols-1 gap-4 h-full lg:grid-cols-2">
						<div
							class={`p-4 ${showRecipe ? "hidden" : "block"} h-screen lg:block`}
						>
							<Game setShowRecipe={setShowRecipe} />
						</div>
						<div
							class={`p-4 ${showRecipe ? "block" : "hidden"} h-screen lg:block`}
						>
							<Recipe setShowRecipe={setShowRecipe} />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
