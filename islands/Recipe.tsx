const h1 = "text-2xl font-bold tracking-tight py-2";
const h2 = "text-lg font-bold tracking-tight py-2";
const h3 = "text-base font-bold tracking-tight py-2";
const h4 = "text-sm font-bold tracking-tight py-2";
const p = "text-xs tracking-tight py-1";

interface RecipeProps {
	setShowRecipe: (showRecipe: boolean) => void;
}

export default function Recipe({ setShowRecipe }: RecipeProps) {
	return (
		<div class="font-mono flex flex-col w-full h-full overflow-y-auto px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-300">
			<h1 class={h1}>Recipe</h1>
			<h2 class={h2}>
				<a
					class="underline"
					href="https://www.theguardian.com/food/2021/may/22/yotam-ottolenghi-tofu-recipes-spicy-sambal-beer-battered-coconut-flan-coffee-caramel"
					target="_blank"
				>
					Tofu in spicy sambal with cashews and ginger pickle
				</a>
			</h2>
			<a
				class="self-center"
				href="https://www.theguardian.com/food/2021/may/22/yotam-ottolenghi-tofu-recipes-spicy-sambal-beer-battered-coconut-flan-coffee-caramel"
				target="_blank"
			>
				<img
					class="self-center w-48 rounded-lg"
					src="https://i.guim.co.uk/img/media/dfb4e9c1fe7dc5c28d80b8511a459578a610e505/0_0_3630_4266/master/3630.jpg?width=300&quality=45&dpr=2&s=none"
					alt="Picture of the 'tofu in spicy sambal with cashews and ginger pickle' dish"
				/>
			</a>
			<h3 class={h3}>Ingredients</h3>
			<h4 class={h4}>For the tofu</h4>
			<ul>
				<p class={p}>Tofu, garlic cloves, soy sauce, lime juice, cashew nuts</p>
			</ul>
			<h4 class={h4}>For the ginger pickle</h4>
			<ul>
				<p class={p}>Fresh ginger, red wine vinegar, maple syrup</p>
			</ul>
			<h4 class={h4}>For the sambal</h4>
			<ul>
				<p class={`${p} line-through`}>
					Olive oil, shallots, garlic cloves, fresh large chillis, fresh lime
					leaves, star anise, fresh coriander, hot dried chillis, caraway seeds,
					ground turmeric, tomato paste, maple syrup, water
				</p>
				<p class={`text-base font-bold tracking-tight py-1`}>
					Note: Buy sambal sauce from the store
				</p>
			</ul>
			<h3 class={h3}>Directions</h3>
			<ol class="list-inside list-decimal">
				<li class={p}>
					Pat dry the tofu with kitchen towel, then cut the block into cubes.
				</li>
				<li class={p}>
					In a small bowl, mix the garlic, soy sauce and lime juice, add the
					tofu cubes and leave to marinate for at least 30 minutes.
				</li>
				<li class={p}>
					Heat the oven. Bake the cashews for 12 minutes, until they take on a
					deep brown colour and look as if they’ve spent a day tanning at the
					beach, but are not actually burnt. Set aside to cool.
				</li>
				<li class={p}>
					Mix all the ginger pickle ingredients in a small bowl and set aside
					for at least 20 minutes.
				</li>
				<li class={p}>
					Once the tofu is marinated, bake it in the oven for 20 minutes. Set
					aside.
				</li>
				<li class={p}>
					On a large serving platter, mix together the sambal ingredients. Add
					the tofu to the platter. Scatter the pickled ginger and cashews on
					top.
				</li>
			</ol>
			<button
				className="text-mono px-4 py-2 ml-2 text-white rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 my-4 lg:hidden"
				onClick={() => setShowRecipe(false)}
			>
				Return to Game
			</button>
		</div>
	);
}
