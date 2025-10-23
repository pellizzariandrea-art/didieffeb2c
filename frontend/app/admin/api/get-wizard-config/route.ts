export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
    const response = await fetch(`${apiUrl}/admin/api/get-wizard-config.php`);
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching wizard config:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch wizard config' },
      { status: 500 }
    );
  }
}
