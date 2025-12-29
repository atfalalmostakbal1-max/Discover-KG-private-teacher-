
import { Theme, KGLevel } from './types';

export const CURRICULUM_DATA: Record<KGLevel, Theme[]> = {
  [KGLevel.KG1]: [
    {
      id: 't1_kg1',
      title: { ar: 'من أكون؟', en: 'Who Am I?' },
      color: 'bg-pink-400',
      chapters: [
        {
          id: 'c1',
          title: { ar: 'أعرفني', en: 'Knowing Me' },
          lessons: [
            { id: 'l1', title: { ar: 'أشيائي الجميلة', en: 'My Beautiful Things' }, description: { ar: 'التعرف على الأشياء الشخصية والألوان', en: 'Identifying personal belongings and colors' }, type: 'activity' },
            { id: 'l2', title: { ar: 'قصة عائلتي', en: 'My Family Story' }, description: { ar: 'التعرف على أفراد الأسرة', en: 'Meet family members' }, type: 'story' }
          ]
        },
        {
          id: 'c2',
          title: { ar: 'شجري المفضل', en: 'My Favorite Trees' },
          lessons: [
            { id: 'l3', title: { ar: 'أجزاء النبات', en: 'Plant Parts' }, description: { ar: 'كيف ينمو النبات', en: 'How plants grow' }, type: 'experiment' },
            { id: 'l4', title: { ar: 'دورة حياة البذرة', en: 'Seed Life Cycle' }, description: { ar: 'من البذرة إلى الثمرة', en: 'From seed to fruit' }, type: 'story' }
          ]
        }
      ]
    },
    {
      id: 't2_kg1',
      title: { ar: 'العالم من حولي', en: 'World Around Me' },
      color: 'bg-blue-400',
      chapters: [
        {
          id: 'c3',
          title: { ar: 'بيئتي', en: 'My Environment' },
          lessons: [
            { id: 'l5', title: { ar: 'الحيوانات في المزرعة', en: 'Farm Animals' }, description: { ar: 'أصوات وأشكال الحيوانات', en: 'Animal sounds and shapes' }, type: 'activity' },
            { id: 'l6', title: { ar: 'الطقس اليوم', en: 'Today\'s Weather' }, description: { ar: 'الفصول الأربعة والملابس', en: 'Four seasons and clothes' }, type: 'activity' }
          ]
        }
      ]
    },
    {
      id: 't3_kg1',
      title: { ar: 'كيف يعمل العالم؟', en: 'How the World Works' },
      color: 'bg-yellow-400',
      chapters: [
        {
          id: 'c4',
          title: { ar: 'المواد والاشياء', en: 'Materials' },
          lessons: [
            { id: 'l7', title: { ar: 'الطفو والغوص', en: 'Sink or Float' }, description: { ar: 'تجربة الماء والاجسام', en: 'Water experiment' }, type: 'experiment' },
            { id: 'l8', title: { ar: 'الناعم والخشن', en: 'Smooth vs Rough' }, description: { ar: 'حاسة اللمس', en: 'Sense of touch' }, type: 'activity' }
          ]
        }
      ]
    },
    {
      id: 't4_kg1',
      title: { ar: 'التواصل', en: 'Communication' },
      color: 'bg-purple-400',
      chapters: [
        {
          id: 'c5',
          title: { ar: 'عبر عن نفسك', en: 'Express Yourself' },
          lessons: [
            { id: 'l9', title: { ar: 'لغة الجسد', en: 'Body Language' }, description: { ar: 'كيف نعبر عن مشاعرنا', en: 'Expressing feelings' }, type: 'story' },
            { id: 'l10', title: { ar: 'الموسيقى والأصوات', en: 'Music and Sounds' }, description: { ar: 'صناعة آلة موسيقية', en: 'Making an instrument' }, type: 'activity' }
          ]
        }
      ]
    }
  ],
  [KGLevel.KG2]: [
    {
      id: 't1_kg2',
      title: { ar: 'من أكون؟', en: 'Who Am I?' },
      color: 'bg-red-400',
      chapters: [
        {
          id: 'c6',
          title: { ar: 'أنا أكبر', en: 'I Am Growing' },
          lessons: [
            { id: 'l11', title: { ar: 'أعضاء جسمي', en: 'My Body Organs' }, description: { ar: 'القلب والرئتين', en: 'Heart and lungs' }, type: 'activity' },
            { id: 'l12', title: { ar: 'العادات الصحية', en: 'Healthy Habits' }, description: { ar: 'الغذاء الصحي والرياضة', en: 'Healthy food and sports' }, type: 'activity' }
          ]
        }
      ]
    },
    {
      id: 't2_kg2',
      title: { ar: 'العالم من حولي', en: 'World Around Me' },
      color: 'bg-indigo-400',
      chapters: [
        {
          id: 'c7',
          title: { ar: 'سكان العالم', en: 'World Citizens' },
          lessons: [
            { id: 'l13', title: { ar: 'خرائط ومواقع', en: 'Maps and Locations' }, description: { ar: 'أين أعيش؟', en: 'Where do I live?' }, type: 'activity' },
            { id: 'l14', title: { ar: 'الماء سر الحياة', en: 'Water is Life' }, description: { ar: 'ترشيد الاستهلاك', en: 'Saving water' }, type: 'experiment' }
          ]
        }
      ]
    },
    {
      id: 't3_kg2',
      title: { ar: 'كيف يعمل العالم؟', en: 'How the World Works' },
      color: 'bg-green-500',
      chapters: [
        {
          id: 'c8',
          title: { ar: 'السوق والمجتمع', en: 'Market & Community' },
          lessons: [
            { id: 'l15', title: { ar: 'النقود والميزانية', en: 'Money and Budget' }, description: { ar: 'البيع والشراء', en: 'Buying and selling' }, type: 'activity' },
            { id: 'l16', title: { ar: 'المهن والوظائف', en: 'Jobs and Careers' }, description: { ar: 'من يساعدنا في المجتمع؟', en: 'Who helps us?' }, type: 'story' }
          ]
        }
      ]
    },
    {
      id: 't4_kg2',
      title: { ar: 'التواصل', en: 'Communication' },
      color: 'bg-orange-400',
      chapters: [
        {
          id: 'c9',
          title: { ar: 'نقل المعلومات', en: 'Transferring Info' },
          lessons: [
            { id: 'l17', title: { ar: 'الرسائل والبريد', en: 'Mail and Letters' }, description: { ar: 'كيف نتواصل قديماً وحديثاً', en: 'Past and present communication' }, type: 'activity' },
            { id: 'l18', title: { ar: 'وسائل المواصلات', en: 'Transportation' }, description: { ar: 'تواصل المدن', en: 'Connecting cities' }, type: 'activity' }
          ]
        }
      ]
    }
  ]
};
