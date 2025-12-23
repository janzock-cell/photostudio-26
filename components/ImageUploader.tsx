import React, { useRef } from 'react';

interface ImageUploaderProps {
  onImagesSelect: (files: File[]) => void;
  images: { url: string }[];
  onImageRemove: (index: number) => void;
  onImageClick: (url: string) => void;
  onImageCrop: (index: number) => void;
  isDarkMode?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesSelect, images, onImageRemove, onImageClick, onImageCrop, isDarkMode = true }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onImagesSelect(Array.from(files));
      event.target.value = '';
    }
  };
  const handleClick = () => fileInputRef.current?.click();
  const containerBg = isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300';

  return (
    <div className="w-full">
      <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Deine Bilder</h2>
      <div className={`w-full min-h-[10rem] p-4 relative border-2 border-dashed rounded-xl flex items-center justify-center ${containerBg} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
        {images.length === 0 && (
          <div className={`w-full h-full flex items-center justify-center cursor-pointer transition-colors duration-300 rounded-xl ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={handleClick}>
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="mt-2">Klicken zum Hochladen</p>
            </div>
          </div>
        )}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
            {images.map((image, index) => (
              <div key={image.url} className="relative aspect-square group">
                <img src={image.url} alt={`upload-preview-${index}`} className="w-full h-full object-cover rounded-md cursor-pointer border border-gray-600" onClick={() => onImageClick(image.url)} />
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
                    <button onClick={() => onImageCrop(index)} className="bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M18 10a1 1 0 01-2 0V2.5a.5.5 0 00-.5-.5H8a1 1 0 010-2h7.5A2.5 2.5 0 0118 2.5V10zM2 9.5A.5.5 0 012.5 9H8a1 1 0 010 2H2.5a.5.5 0 01-.5-.5V2.5A2.5 2.5 0 015 0h7.5a1 1 0 010 2H5a.5.5 0 00-.5.5V9.5z" /></svg></button>
                    <button onClick={() => onImageRemove(index)} className="bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              </div>
            ))}
            <button onClick={handleClick} className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md transition-colors ${isDarkMode ? 'border-gray-600 hover:bg-gray-700/50' : 'border-gray-300 hover:bg-gray-100'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
          </div>
        )}
      </div>
    </div>
  );
};
export default ImageUploader;