export async function GET() {
  try {
    const response = await fetch('https://shop.didieffeb2b.com/admin/api/get-wizard-config.php');
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
