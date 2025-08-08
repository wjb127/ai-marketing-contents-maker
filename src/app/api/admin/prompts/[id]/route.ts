import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET: 특정 프롬프트 템플릿 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: template, error } = await supabase
      .from('system_prompt_templates')
      .select(`
        *,
        prompt_categories(name, description)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('❌ Error fetching prompt template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!template) {
      return NextResponse.json({ error: '템플릿을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('❌ Error in GET /api/admin/prompts/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT: 프롬프트 템플릿 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      template,
      variables,
      change_notes,
      is_active
    } = body

    const supabase = await createClient()

    const { data: updatedTemplate, error } = await supabase
      .from('system_prompt_templates')
      .update({
        title,
        description,
        template,
        variables: variables || [],
        change_notes,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating prompt template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Updated prompt template:', updatedTemplate.name)
    return NextResponse.json({ template: updatedTemplate })
  } catch (error: any) {
    console.error('❌ Error in PUT /api/admin/prompts/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: 프롬프트 템플릿 삭제 (비활성화)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // 실제로는 삭제하지 않고 비활성화
    const { data: deactivatedTemplate, error } = await supabase
      .from('system_prompt_templates')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error deactivating prompt template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Deactivated prompt template:', deactivatedTemplate.name)
    return NextResponse.json({ message: '템플릿이 비활성화되었습니다.' })
  } catch (error: any) {
    console.error('❌ Error in DELETE /api/admin/prompts/[id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}