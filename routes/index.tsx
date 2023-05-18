import Game from "../islands/Game.tsx";

export default function Home() {
	return (
		<>
			<div className="w-full">
				<div class="p-4 mx-auto max-w-screen-md h-screen">
					<Game />
				</div>
			</div>
		</>
	);
}
