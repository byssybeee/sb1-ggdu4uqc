import axios from 'axios';

const API_KEY = 'HPdTsjtovdVScoYaayu9qeL7';
const API_URL = 'https://api.remove.bg/v1.0/removebg';

export async function removeBackground(imageFile: File): Promise<string> {
  if (!imageFile.type.startsWith('image/')) {
    throw new Error('Please upload a valid image file');
  }

  const formData = new FormData();
  formData.append('image_file', imageFile);
  formData.append('size', 'auto');
  formData.append('format', 'png');

  try {
    const response = await axios({
      method: 'post',
      url: API_URL,
      data: formData,
      headers: {
        'X-Api-Key': API_KEY,
      },
      responseType: 'arraybuffer'
    });

    // Convert array buffer to base64
    const base64String = btoa(
      new Uint8Array(response.data)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return `data:image/png;base64,${base64String}`;
  } catch (error) {
    console.error('Background removal error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 402) {
        throw new Error('API credit limit exceeded');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid API key');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid image format');
      }
      throw new Error(`Failed to process image: ${error.message}`);
    }
    throw new Error('Failed to connect to the background removal service. Please try again.');
  }
}