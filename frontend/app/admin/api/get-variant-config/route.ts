export async function GET() {
  try {
    const response = await fetch('https://shop.didieffeb2b.com/admin/data/variant-config.json');
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching variant config:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch variant config' },
      { status: 500 }
    );
  }
}
