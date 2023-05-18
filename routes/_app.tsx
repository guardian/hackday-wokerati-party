import { asset, Head } from "$fresh/runtime.ts";
import { AppProps } from "$fresh/src/server/types.ts";

export default function App({ Component }: AppProps) {
	return (
		<html data-custom="data">
			<Head>
				<title>Tofu-eating wokerati dinner party</title>

				<link rel="stylesheet" href={asset("style.css")} />
			</Head>
			<body class="bodyClass">
				<Component />
			</body>
		</html>
	);
}
