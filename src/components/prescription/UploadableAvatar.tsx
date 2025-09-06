import {useRef, useState} from 'react';
import {Camera} from 'lucide-react';


export default function UploadableAvatar() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const handleIconClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click(); // Open file selector
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setImageUrl(reader.result); // Set the image preview
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="row-start-1 col-start-3 flex justify-end items-start pr-2">
            <div
                className="relative ml-2 mt-2 text-sm opacity-90 rounded-full w-16 h-16 bg-transparent overflow-hidden group">
                {/* Preview uploaded image */}
                {imageUrl && (
                    <img src={imageUrl} alt="Uploaded" className="w-full h-full object-cover rounded-full"/>
                )}

                {/* Hidden file input */}
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Camera icon centered */}
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-100 group-hover:opacity-100 cursor-pointer transition"
                    onClick={handleIconClick}
                >
                    <Camera className="text-white w-6 h-6"/>
                </div>
            </div>
        </div>
    );
}