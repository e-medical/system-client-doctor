// import { useState, useEffect } from 'react';
//
// interface Theme {
//     bg: string;
//     border: string;
//     face: string;
//     hourHand: string;
//     minuteHand: string;
//     secondHand: string;
//     marks: string;
//     shadow: string;
// }
//
// interface AnalogWatchProps {
//     size?: number;
//     showDigital?: boolean;
//     theme?: keyof typeof themes;
//     showSecondHand?: boolean;
//     className?: string;
// }
//
// const AnalogWatch = ({
//                          size = 200,
//                          showDigital = true,
//                          theme = 'light',
//                          showSecondHand = true,
//                          className = ''
//                      }: AnalogWatchProps) => {
//     const [time, setTime] = useState(new Date());
//
//     useEffect(() => {
//         const timer = setInterval(() => {
//             setTime(new Date());
//         }, 1000);
//
//         return () => clearInterval(timer);
//     }, []);
//
//     const seconds = time.getSeconds();
//     const minutes = time.getMinutes();
//     const hours = time.getHours() % 12;
//
//     // Calculate angles for hands
//     const secondAngle = (seconds * 6) - 90; // 6 degrees per second
//     const minuteAngle = (minutes * 6 + seconds * 0.1) - 90; // 6 degrees per minute + smooth seconds
//     const hourAngle = (hours * 30 + minutes * 0.5) - 90; // 30 degrees per hour + smooth minutes
//
//     const radius = size / 2;
//     const hourMarkLength = radius * 0.15;
//     const minuteMarkLength = radius * 0.08;
//
//     // Theme configurations
//     const themes: Record<string, Theme> = {
//         light: {
//             bg: 'bg-white',
//             border: 'border-gray-300',
//             face: 'text-gray-800',
//             hourHand: '#374151',
//             minuteHand: '#4B5563',
//             secondHand: '#EF4444',
//             marks: '#6B7280',
//             shadow: 'shadow-lg'
//         },
//         dark: {
//             bg: 'bg-gray-900',
//             border: 'border-gray-600',
//             face: 'text-white',
//             hourHand: '#F3F4F6',
//             minuteHand: '#D1D5DB',
//             secondHand: '#EF4444',
//             marks: '#9CA3AF',
//             shadow: 'shadow-2xl'
//         },
//         elegant: {
//             bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
//             border: 'border-amber-300',
//             face: 'text-amber-900',
//             hourHand: '#92400E',
//             minuteHand: '#B45309',
//             secondHand: '#DC2626',
//             marks: '#A16207',
//             shadow: 'shadow-xl'
//         }
//     };
//
//     const currentTheme = themes[theme] || themes.light;
//
//     // Generate hour marks (1-12)
//     const hourMarks = Array.from({ length: 12 }, (_, i) => {
//         const angle = (i * 30) * (Math.PI / 180);
//         const x1 = radius + (radius - hourMarkLength) * Math.cos(angle);
//         const y1 = radius + (radius - hourMarkLength) * Math.sin(angle);
//         const x2 = radius + (radius - hourMarkLength * 0.3) * Math.cos(angle);
//         const y2 = radius + (radius - hourMarkLength * 0.3) * Math.sin(angle);
//
//         return { x1, y1, x2, y2, number: i === 0 ? 12 : i };
//     });
//
//     // Generate minute marks
//     const minuteMarks = Array.from({ length: 60 }, (_, i) => {
//         if (i % 5 === 0) return null; // Skip hour positions
//         const angle = (i * 6) * (Math.PI / 180);
//         const x1 = radius + (radius - minuteMarkLength) * Math.cos(angle);
//         const y1 = radius + (radius - minuteMarkLength) * Math.sin(angle);
//         const x2 = radius + (radius - minuteMarkLength * 0.5) * Math.cos(angle);
//         const y2 = radius + (radius - minuteMarkLength * 0.5) * Math.sin(angle);
//
//         return { x1, y1, x2, y2 };
//     }).filter((mark): mark is { x1: number; y1: number; x2: number; y2: number } => mark !== null);
//
//     // Digital time display
//     const digitalTime = time.toLocaleTimeString('en-US', {
//         hour12: true,
//         hour: '2-digit',
//         minute: '2-digit',
//         second: showSecondHand ? '2-digit' : undefined
//     });
//
//     return (
//         <div className={`inline-flex flex-col items-center space-y-4 ${className}`}>
//             <div
//                 className={`relative ${currentTheme.bg} ${currentTheme.border} ${currentTheme.shadow} border-4 rounded-full p-4`}
//                 style={{ width: size + 32, height: size + 32 }}
//             >
//                 {/* Watch Face SVG */}
//                 <svg
//                     width={size}
//                     height={size}
//                     className="absolute inset-3.5"
//                     viewBox={`0 0 ${size} ${size}`}
//                 >
//                     {/* Outer circle */}
//                     <circle
//                         cx={radius}
//                         cy={radius}
//                         r={radius - 2}
//                         fill="transparent"
//                         stroke={currentTheme.marks}
//                         strokeWidth="1"
//                         opacity="0.3"
//                     />
//
//                     {/* Hour marks */}
//                     {hourMarks.map((mark, i) => (
//                         <g key={`hour-${i}`}>
//                             <line
//                                 x1={mark.x1}
//                                 y1={mark.y1}
//                                 x2={mark.x2}
//                                 y2={mark.y2}
//                                 stroke={currentTheme.marks}
//                                 strokeWidth="3"
//                                 strokeLinecap="round"
//                             />
//                             {/* Hour numbers */}
//                             <text
//                                 x={radius + (radius * 0.75) * Math.cos((i * 30) * (Math.PI / 180))}
//                                 y={radius + (radius * 0.75) * Math.sin((i * 30) * (Math.PI / 180)) + 6}
//                                 textAnchor="middle"
//                                 fontSize={size * 0.08}
//                                 fill={currentTheme.marks}
//                                 fontWeight="bold"
//                                 className="select-none"
//                             >
//                                 {mark.number}
//                             </text>
//                         </g>
//                     ))}
//
//                     {/* Minute marks */}
//                     {minuteMarks.map((mark, i) => (
//                         <line
//                             key={`minute-${i}`}
//                             x1={mark.x1}
//                             y1={mark.y1}
//                             x2={mark.x2}
//                             y2={mark.y2}
//                             stroke={currentTheme.marks}
//                             strokeWidth="1"
//                             opacity="0.6"
//                         />
//                     ))}
//
//                     {/* Hour Hand */}
//                     <line
//                         x1={radius}
//                         y1={radius}
//                         x2={radius + (radius * 0.5) * Math.cos(hourAngle * (Math.PI / 180))}
//                         y2={radius + (radius * 0.5) * Math.sin(hourAngle * (Math.PI / 180))}
//                         stroke={currentTheme.hourHand}
//                         strokeWidth="6"
//                         strokeLinecap="round"
//                         style={{ transition: 'transform 0.5s ease-in-out' }}
//                     />
//
//                     {/* Minute Hand */}
//                     <line
//                         x1={radius}
//                         y1={radius}
//                         x2={radius + (radius * 0.75) * Math.cos(minuteAngle * (Math.PI / 180))}
//                         y2={radius + (radius * 0.75) * Math.sin(minuteAngle * (Math.PI / 180))}
//                         stroke={currentTheme.minuteHand}
//                         strokeWidth="4"
//                         strokeLinecap="round"
//                         style={{ transition: 'transform 0.5s ease-in-out' }}
//                     />
//
//                     {/* Second Hand */}
//                     {showSecondHand && (
//                         <line
//                             x1={radius}
//                             y1={radius}
//                             x2={radius + (radius * 0.85) * Math.cos(secondAngle * (Math.PI / 180))}
//                             y2={radius + (radius * 0.85) * Math.sin(secondAngle * (Math.PI / 180))}
//                             stroke={currentTheme.secondHand}
//                             strokeWidth="2"
//                             strokeLinecap="round"
//                             style={{ transition: seconds === 0 ? 'none' : 'transform 0.1s ease-out' }}
//                         />
//                     )}
//
//                     {/* Center dot */}
//                     <circle
//                         cx={radius}
//                         cy={radius}
//                         r="8"
//                         fill={currentTheme.secondHand}
//                         stroke={currentTheme.bg.includes('white') ? '#fff' : '#1F2937'}
//                         strokeWidth="2"
//                     />
//
//                     {/* Inner center dot */}
//                     <circle
//                         cx={radius}
//                         cy={radius}
//                         r="4"
//                         fill={currentTheme.hourHand}
//                     />
//                 </svg>
//
//                 {/* Brand/Logo area */}
//                 <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2">
//                     <div className={`text-xs font-semibold ${currentTheme.face} opacity-60`}>
//                         ANALOG
//                     </div>
//                 </div>
//             </div>
//
//             {/* Digital Time Display */}
//             {showDigital && (
//                 <div className={`${currentTheme.bg} ${currentTheme.border} ${currentTheme.face} px-4 py-2 rounded-lg border font-mono text-sm font-semibold shadow-md`}>
//                     {digitalTime}
//                 </div>
//             )}
//         </div>
//     );
// };
//
// // Demo component showing different configurations
// const AnalogWatchDemo = () => {
//     return (
//         <div className="p-2 bg-gray-50 h-auto">
//             <div className="w-full mx-auto">
//             {/*    <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">*/}
//             {/*        Analog Watch Component*/}
//             {/*    </h1>*/}
//
//                 {/*<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">*/}
//                     {/* Light Theme */}
//                     <div className="flex flex-col items-center space-y-4">
//                         {/*<h3 className="text-lg font-semibold text-gray-700">Light Theme</h3>*/}
//                         <AnalogWatch
//                             size={180}
//                             theme="light"
//                             showDigital={true}
//                             showSecondHand={true}
//                         />
//                     </div>
//
//                     {/*/!* Dark Theme *!/*/}
//                     {/*<div className="flex flex-col items-center space-y-4">*/}
//                     {/*    <h3 className="text-lg font-semibold text-gray-700">Dark Theme</h3>*/}
//                     {/*    <AnalogWatch*/}
//                     {/*        size={180}*/}
//                     {/*        theme="dark"*/}
//                     {/*        showDigital={true}*/}
//                     {/*        showSecondHand={true}*/}
//                     {/*    />*/}
//                     {/*</div>*/}
//
//                     {/*/!* Elegant Theme *!/*/}
//                     {/*<div className="flex flex-col items-center space-y-4">*/}
//                     {/*    <h3 className="text-lg font-semibold text-gray-700">Elegant Theme</h3>*/}
//                     {/*    <AnalogWatch*/}
//                     {/*        size={180}*/}
//                     {/*        theme="elegant"*/}
//                     {/*        showDigital={true}*/}
//                     {/*        showSecondHand={true}*/}
//                     {/*    />*/}
//                     {/*</div>*/}
//
//                     {/*/!* Large Size *!/*/}
//                     {/*<div className="flex flex-col items-center space-y-4">*/}
//                     {/*    <h3 className="text-lg font-semibold text-gray-700">Large Size</h3>*/}
//                     {/*    <AnalogWatch*/}
//                     {/*        size={240}*/}
//                     {/*        theme="light"*/}
//                     {/*        showDigital={false}*/}
//                     {/*        showSecondHand={true}*/}
//                     {/*    />*/}
//                     {/*</div>*/}
//
//                     {/*/!* No Second Hand *!/*/}
//                     {/*<div className="flex flex-col items-center space-y-4">*/}
//                     {/*    <h3 className="text-lg font-semibold text-gray-700">No Second Hand</h3>*/}
//                     {/*    <AnalogWatch*/}
//                     {/*        size={180}*/}
//                     {/*        theme="dark"*/}
//                     {/*        showDigital={true}*/}
//                     {/*        showSecondHand={false}*/}
//                     {/*    />*/}
//                     {/*</div>*/}
//
//                     {/*/!* Minimal *!/*/}
//                     {/*<div className="flex flex-col items-center space-y-4">*/}
//                     {/*    <h3 className="text-lg font-semibold text-gray-700">Minimal</h3>*/}
//                     {/*    <AnalogWatch*/}
//                     {/*        size={160}*/}
//                     {/*        theme="elegant"*/}
//                     {/*        showDigital={false}*/}
//                     {/*        showSecondHand={false}*/}
//                     {/*    />*/}
//                     {/*</div>*/}
//                 </div>
//             </div>
//         // </div>
//     );
// };
//
// export default AnalogWatchDemo;