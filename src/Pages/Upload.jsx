import React, { useState } from "react";
import { uploadFile } from "../Services/API";
import toast, { Toaster } from "react-hot-toast";
import Loader from "../components/Loader"; 

const Upload = () => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false); 

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
    } else {
      toast.error("Please upload an image file (jpg, jpeg, png, gif).");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true); 

    try {
      const response = await uploadFile(file);
      setFileUrl(response.data.url);
      toast.success("File uploaded successfully!");

      setTimeout(() => {
        setFile(null);
      }, 3000);
    } catch (error) {
      toast.error("Error uploading file: " + error.message);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-bold mb-4">Upload File</h2>
        <input
          type="file"
          onChange={handleFileChange}
          className="w-full p-2 mb-4 border rounded"
          disabled={loading}
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 flex justify-center"
          disabled={loading}
        >
          {loading ? <Loader /> : "Upload"}
        </button>

        {fileUrl && (
          <div className="mt-4">
            <p className="text-green-600">File uploaded successfully!</p>
            <img src={fileUrl} alt="Uploaded" className="mt-2 rounded-lg" />
          </div>
        )}
      </form>
      <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default Upload;
