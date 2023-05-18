import { asset, Head } from "$fresh/runtime.ts";
import { AppProps } from "$fresh/src/server/types.ts";

export default function App({ Component }: AppProps) {
	return (
		<html data-custom="data">
			<Head>
				<title>Tofu-eating wokerati dinner party</title>
				<meta
					name="description"
					content="Your date is coming for dinner in an hour and a half, and you have decided, perhaps too ambitiously, to cook them an elaborate Ottolenghi recipe from the Guardian archives. You have a kitchen, but only some of the ingredients. Good luck!"
				/>

				<link rel="stylesheet" href={asset("style.css")} />
			</Head>
			<body class="bodyClass">
				<Component />
			</body>
		</html>
	);
}
