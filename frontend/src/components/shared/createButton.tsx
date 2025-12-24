/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode } from "react";

const CreateButton = ({
	children,
	onClick,
}: {
	children: ReactNode;
	onClick: () => void;
}) => {
	return (
		<>
			<style>
				{`
					.create-btn {
						position: relative;
						padding: 8px 12px;
						background: #8f51ea;
						font-size: 17px;
						font-weight: 500;
						border: 3px solid #8f51ea;
						border-radius: 8px;
						box-shadow: 0 0 0 #8f51ea;
						transition: all 0.3s ease-in-out;
						cursor: pointer;
					}

					.star-1 {
						position: absolute;
						top: 20%;
						left: 20%;
						width: 25px;
						height: auto;
						filter: drop-shadow(0 0 0 #fffdef);
						z-index: -5;
						transition: all 1s cubic-bezier(0.05, 0.83, 0.43, 0.96);
					}

					.star-2 {
						position: absolute;
						top: 45%;
						left: 45%;
						width: 15px;
						height: auto;
						filter: drop-shadow(0 0 0 #fffdef);
						z-index: -5;
						transition: all 1s cubic-bezier(0, 0.4, 0, 1.01);
					}

					.star-3 {
						position: absolute;
						top: 40%;
						left: 40%;
						width: 5px;
						height: auto;
						filter: drop-shadow(0 0 0 #fffdef);
						z-index: -5;
						transition: all 1s cubic-bezier(0, 0.4, 0, 1.01);
					}

					.star-4 {
						position: absolute;
						top: 20%;
						left: 40%;
						width: 8px;
						height: auto;
						filter: drop-shadow(0 0 0 #fffdef);
						z-index: -5;
						transition: all 0.8s cubic-bezier(0, 0.4, 0, 1.01);
					}

					.star-5 {
						position: absolute;
						top: 25%;
						left: 45%;
						width: 15px;
						height: auto;
						filter: drop-shadow(0 0 0 #fffdef);
						z-index: -5;
						transition: all 0.6s cubic-bezier(0, 0.4, 0, 1.01);
					}

					.star-6 {
						position: absolute;
						top: 5%;
						left: 50%;
						width: 5px;
						height: auto;
						filter: drop-shadow(0 0 0 #fffdef);
						z-index: -5;
						transition: all 0.8s ease;
					}

					.create-btn:hover {
						background: transparent;
						color: #8f51ea;
						box-shadow: 0 0 25px #8f51ea;
					}

					.create-btn:hover .star-1 {
						position: absolute;
						top: -80%;
						left: -30%;
						width: 25px;
						height: auto;
						filter: drop-shadow(0 0 10px #fffdef);
						z-index: 2;
					}

					.create-btn:hover .star-2 {
						position: absolute;
						top: -25%;
						left: 10%;
						width: 15px;
						height: auto;
						filter: drop-shadow(0 0 10px #fffdef);
						z-index: 2;
					}

					.create-btn:hover .star-3 {
						position: absolute;
						top: 55%;
						left: 25%;
						width: 5px;
						height: auto;
						filter: drop-shadow(0 0 10px #fffdef);
						z-index: 2;
					}

					.create-btn:hover .star-4 {
						position: absolute;
						top: 30%;
						left: 80%;
						width: 8px;
						height: auto;
						filter: drop-shadow(0 0 10px #fffdef);
						z-index: 2;
					}

					.create-btn:hover .star-5 {
						position: absolute;
						top: 25%;
						left: 115%;
						width: 15px;
						height: auto;
						filter: drop-shadow(0 0 10px #fffdef);
						z-index: 2;
					}

					.create-btn:hover .star-6 {
						position: absolute;
						top: 5%;
						left: 60%;
						width: 5px;
						height: auto;
						filter: drop-shadow(0 0 10px #fffdef);
						z-index: 2;
					}

					.fil0 {
						fill: #fffdef;
					}
				`}
			</style>
			<button className="create-btn" onClick={onClick}>
				<div className="w-full flex justify-center items-center">
					{children}
				</div>
				<div className="star-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xmlSpace="preserve"
						version="1.1"
						style={{
							shapeRendering: "geometricPrecision",
							textRendering: "geometricPrecision",
							imageRendering: "optimizeQuality" as any,
							fillRule: "evenodd",
							clipRule: "evenodd",
						}}
						viewBox="0 0 784.11 815.53"
					>
						<g id="Layer_x0020_1">
							<path
								className="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 
             207.96,29.37 371.12,197.68 392.05,407.74 
             20.93,-210.06 184.09,-378.37 392.05,-407.74 
             -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							/>
						</g>
					</svg>
				</div>
				<div className="star-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xmlSpace="preserve"
						version="1.1"
						style={{
							shapeRendering: "geometricPrecision",
							textRendering: "geometricPrecision",
							imageRendering: "optimizeQuality" as any,
							fillRule: "evenodd",
							clipRule: "evenodd",
						}}
						viewBox="0 0 784.11 815.53"
					>
						<g id="Layer_x0020_1">
							<path
								className="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 
             207.96,29.37 371.12,197.68 392.05,407.74 
             20.93,-210.06 184.09,-378.37 392.05,-407.74 
             -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							/>
						</g>
					</svg>
				</div>
				<div className="star-3">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xmlSpace="preserve"
						version="1.1"
						style={{
							shapeRendering: "geometricPrecision",
							textRendering: "geometricPrecision",
							imageRendering: "optimizeQuality" as any,
							fillRule: "evenodd",
							clipRule: "evenodd",
						}}
						viewBox="0 0 784.11 815.53"
					>
						<g id="Layer_x0020_1">
							<path
								className="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 
             207.96,29.37 371.12,197.68 392.05,407.74 
             20.93,-210.06 184.09,-378.37 392.05,-407.74 
             -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							/>
						</g>
					</svg>
				</div>
				<div className="star-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xmlSpace="preserve"
						version="1.1"
						style={{
							shapeRendering: "geometricPrecision",
							textRendering: "geometricPrecision",
							imageRendering: "optimizeQuality" as any,
							fillRule: "evenodd",
							clipRule: "evenodd",
						}}
						viewBox="0 0 784.11 815.53"
					>
						<g id="Layer_x0020_1">
							<path
								className="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 
             207.96,29.37 371.12,197.68 392.05,407.74 
             20.93,-210.06 184.09,-378.37 392.05,-407.74 
             -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							/>
						</g>
					</svg>
				</div>
				<div className="star-5">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xmlSpace="preserve"
						version="1.1"
						style={{
							shapeRendering: "geometricPrecision",
							textRendering: "geometricPrecision",
							imageRendering: "optimizeQuality" as any,
							fillRule: "evenodd",
							clipRule: "evenodd",
						}}
						viewBox="0 0 784.11 815.53"
					>
						<g id="Layer_x0020_1">
							<path
								className="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 
             207.96,29.37 371.12,197.68 392.05,407.74 
             20.93,-210.06 184.09,-378.37 392.05,-407.74 
             -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							/>
						</g>
					</svg>
				</div>
				<div className="star-6">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xmlSpace="preserve"
						version="1.1"
						style={{
							shapeRendering: "geometricPrecision",
							textRendering: "geometricPrecision",
							imageRendering: "optimizeQuality" as any,
							fillRule: "evenodd",
							clipRule: "evenodd",
						}}
						viewBox="0 0 784.11 815.53"
					>
						<g id="Layer_x0020_1">
							<path
								className="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 
             207.96,29.37 371.12,197.68 392.05,407.74 
             20.93,-210.06 184.09,-378.37 392.05,-407.74 
             -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							/>
						</g>
					</svg>
				</div>
			</button>
		</>
	);
};

export default CreateButton;
