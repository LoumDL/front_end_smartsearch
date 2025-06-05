export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = async (file: File): Promise<FileValidationResult> => {
  try {
    // Vérifier la taille maximale (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return {
        isValid: false,
        error: 'Le fichier est trop grand (maximum 50MB)'
      };
    }

    // Liste des types MIME autorisés
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    // Vérifier le type MIME
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Type de fichier non supporté'
      };
    }

    // Vérifier la signature du fichier (pour les PDF)
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const signature = new Uint8Array(arrayBuffer.slice(0, 4));
      
      // Signature PDF standard est %PDF
      if (!signature.every((byte, index) => byte === '%PDF'.charCodeAt(index))) {
        return {
          isValid: false,
          error: 'Le fichier PDF semble corrompu ou invalide'
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error('Erreur lors de la validation du fichier:', error);
    return {
      isValid: false,
      error: 'Erreur lors de la validation du fichier'
    };
  }
};
