// import Image from "next/image";
// import React from "react";
// import { ShowcaseImage } from "./showcase-grid";

// const ShowcaseCard = ({ image }: { image: ShowcaseImage }) => {
//   return (
//     <div className="relative font-sans text-white">
//       {/* Decorative circle */}
//       <div className="absolute top-[30%] right-[7%] h-24 w-24 rounded-full bg-[#fab5704c]" />

//       {/* Decorative square */}
//       <div className="absolute top-[8%] right-[5%] h-12 border border-current" />

//       <div
//         className="
//           flex h-[15.875em] w-[11.875em] flex-col justify-between
//           rounded-xl
//           border border-white/20
//           bg-white/[0.074]
//           p-4
//           backdrop-blur-[20px]
//           transition-all duration-300 ease-in-out
//           hover:border-white/45
//           hover:shadow-[0_0_20px_1px_#ffbb763f]
//         "
//       >
//         <span className="text-[2rem] font-medium tracking-widest">
//           <Image
//             alt={image.alt}
//             className="rounded-t-lg object-cover transition-transform duration-300"
//             fill
//             loading="eager"
//             sizes="(min-width: 1189px) 33vw, (min-width: 560px) 50vw, 100vw"
//             src={image.src}
//           />
//         </span>

//         <div>
//           <div className="mb-2 flex items-center gap-2">
//             <span className="rounded-full bg-[#f6d84f]/10 p-2 text-[#f6d84f]">
//               {image.icon}
//             </span>
//             <h1 className="font-semibold text-base text-foreground tracking-tight">
//               {image.title}
//             </h1>
//           </div>
//           <p className="text-foreground/60 text-sm">{image.description}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ShowcaseCard;
