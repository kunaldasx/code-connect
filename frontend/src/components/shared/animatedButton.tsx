import React, { ReactNode } from "react";

const AnimatedButton = ({ children }: { children: ReactNode }) => {
	return (
		<button type="button" className="btn">
			<strong>{children}</strong>
			<div id="container-stars">
				<div id="stars"></div>
			</div>

			<div id="glow">
				<div className="circle"></div>
				<div className="circle"></div>
			</div>
		</button>
	);
};

export default AnimatedButton;
