import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// GET: 프롬프트 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const active_only = searchParams.get('active_only') === 'true'

    const supabase = createRouteHandlerClient({ cookies })

    let query = supabase
      .from('system_prompt_templates')
      .select(`
        *,
        prompt_categories(name, description)
      `)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category_id', category)
    }

    if (active_only) {
      query = query.eq('is_active', true)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('❌ Error fetching prompt templates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('❌ Error in GET /api/admin/prompts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: 새 프롬프트 템플릿 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      category_id,
      name,
      title,
      description,
      template,
      variables,
      change_notes,
      is_active = false
    } = body

    if (!name || !title || !template) {
      return NextResponse.json(
        { error: 'name, title, template은 필수입니다.' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // 새 버전 번호 계산
    const { data: existingVersions, error: versionError } = await supabase
      .from('system_prompt_templates')
      .select('version')
      .eq('name', name)
      .order('version', { ascending: false })
      .limit(1)

    if (versionError) {
      console.error('❌ Error fetching versions:', versionError)
      return NextResponse.json({ error: versionError.message }, { status: 500 })
    }

    const nextVersion = existingVersions?.length > 0 ? existingVersions[0].version + 1 : 1

    const { data: newTemplate, error } = await supabase
      .from('system_prompt_templates')
      .insert({
        category_id,
        name,
        title,
        description,
        template,
        version: nextVersion,
        variables: variables || [],
        change_notes,
        is_active,
        created_by: 'admin'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating prompt template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Created new prompt template:', newTemplate.name, 'v' + newTemplate.version)
    return NextResponse.json({ template: newTemplate }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Error in POST /api/admin/prompts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}