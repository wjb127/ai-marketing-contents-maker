import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// GET: 활성 프롬프트 템플릿 조회 (콘텐츠 생성에서 사용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json({ error: 'template name은 필수입니다.' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { data: template, error } = await supabase
      .from('system_prompt_templates')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('❌ Error fetching active prompt template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!template) {
      return NextResponse.json({ 
        error: `활성 상태의 '${name}' 템플릿을 찾을 수 없습니다.` 
      }, { status: 404 })
    }

    console.log('✅ Retrieved active template:', template.name, 'v' + template.version)
    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('❌ Error in GET /api/admin/prompts/active:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}