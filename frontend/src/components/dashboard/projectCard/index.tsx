import Link from "next/link";

export default function ProjectCard({
	children,
	id,
}: {
	children: React.ReactNode;
	id: string;
}) {
	return (
		<>
			<style>
				{`
				.card {
					width: 300px;
					height: 200px;
					background-image: linear-gradient(163deg, #fe53bb 0%, #0044ff 100%);
					border-radius: 20px;
					transition: all .3s;
				}	
				.card2 {
					width: 300px;
					height: 200px;
					padding: 20px;
					border-radius: 18px;
					transition: all .2s;
				}	
				.card2:hover {
					transform: scale(0.98);
					border-radius: 20px;
				}	
				.card:hover {
					box-shadow: 0px 0px 30px 1px #8e51ea66;
				}	
				`}
			</style>
			<Link href={`/code/${id}`} tabIndex={0} className="card">
				<div className="card2 flex flex-col justify-between items-start bg-secondary">
					{children}
				</div>
			</Link>
		</>
	);
}
