"use client";

import { useState, useRef } from "react";
import { X, Camera, Upload } from "lucide-react";
import styles from "./ProfilePictureModal.module.css";

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onUpload: (file: File) => Promise<void>;
  userName: string;
}

export default function ProfilePictureModal({
  isOpen,
  onClose,
  currentAvatar,
  onUpload,
  userName,
}: ProfilePictureModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onUpload(selectedFile);
      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setSelectedFile(null);
    setIsUploading(false);
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Change Profile Picture</h2>
          <p className={styles.modalSubtitle}>
            Update your profile picture for {userName}
          </p>
        </div>

        <div className={styles.avatarSection}>
          <div className={styles.avatarPreview}>
            <img
              src={preview || currentAvatar}
              alt="Profile preview"
              className={styles.avatarImage}
            />
            <div className={styles.avatarOverlay}>
              <Camera size={24} strokeWidth={2} />
            </div>
          </div>
        </div>

        <div
          className={styles.uploadZone}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload profile picture"
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.fileInputHidden}
            onChange={handleInputChange}
          />
          <Upload size={28} strokeWidth={1.5} className={styles.uploadIcon} />
          <span className={styles.uploadLabel}>
            {preview ? selectedFile?.name : "Click or drag to upload"}
          </span>
          <span className={styles.uploadHint}>
            {preview ? "Change image" : "PNG, JPG up to 5MB"}
          </span>
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Uploading..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
