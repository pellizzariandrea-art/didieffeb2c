// This endpoint is now replaced by get-gallery-config
// Keeping for backward compatibility
export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
    const response = await fetch(`${apiUrl}/admin/api/get-gallery-config.php`, {
      cache: 'no-store',
    });
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching gallery config:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch gallery config' },
      { status: 500 }
    );
  }
}
