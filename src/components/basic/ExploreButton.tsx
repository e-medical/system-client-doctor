import React from "react";

interface ExploreButtonProps {
    onExplore: () => void;
}

const ExploreButton: React.FC<ExploreButtonProps> = ({ onExplore }) => {
    return (
        <button
            className="bg-blue-500 text-white w-[50px] h-auto text-[7px] z-[50] rounded-full mb-4 hover:bg-blue-600"
            onClick={onExplore}
        >
            Explore More
        </button>
    );
};

export default ExploreButton;
