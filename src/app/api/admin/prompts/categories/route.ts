import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET: 프롬프트 카테고리 목록 조회
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from('prompt_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('❌ Error fetching prompt categories:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('❌ Error in GET /api/admin/prompts/categories:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}