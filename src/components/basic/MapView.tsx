import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
// import ExploreButton from "./ExploreButton.tsx";
//
// const handleExplore = () => {
//     // handle explore action
// };

const MapView = () => {
    const position: LatLngExpression = [7.8731, 80.7718];

    return (
        <div className="relative w-full h-full border border-gray-200 rounded-[3px]">
            <MapContainer center={position} zoom={7} scrollWheelZoom={false} className="h-full w-full z-0">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>Sri Lanka</Popup>
                </Marker>
            </MapContainer>

            {/* Explore Button */}
            <div className="absolute right-2 top-2 z-[500]">
                {/*<ExploreButton onExplore={handleExplore} />*/}
            </div>
        </div>
    );
};

export default MapView;
