import json
from pathlib import Path
CHECK='2026-10-08'
MOE211='https://www.moe.gov.cn/srcsite/A22/s7065/200512/t20051223_82762.html'
MOE985='https://www.moe.gov.cn/srcsite/A22/s7065/200612/t20061206_128833.html'
rows='''北京大学|Peking University|北京|pku.edu.cn
清华大学|Tsinghua University|北京|tsinghua.edu.cn
中国人民大学|Renmin University of China|北京|ruc.edu.cn
北京师范大学|Beijing Normal University|北京|bnu.edu.cn
北京航空航天大学|Beihang University|北京|buaa.edu.cn
北京理工大学|Beijing Institute of Technology|北京|bit.edu.cn
中国农业大学|China Agricultural University|北京|cau.edu.cn
中央民族大学|Minzu University of China|北京|muc.edu.cn
北京交通大学|Beijing Jiaotong University|北京|bjtu.edu.cn
北京工业大学|Beijing University of Technology|北京|bjut.edu.cn
北京科技大学|University of Science and Technology Beijing|北京|ustb.edu.cn
北京化工大学|Beijing University of Chemical Technology|北京|buct.edu.cn
北京邮电大学|Beijing University of Posts and Telecommunications|北京|bupt.edu.cn
北京林业大学|Beijing Forestry University|北京|bjfu.edu.cn
北京中医药大学|Beijing University of Chinese Medicine|北京|bucm.edu.cn
北京外国语大学|Beijing Foreign Studies University|北京|bfsu.edu.cn
中国传媒大学|Communication University of China|北京|cuc.edu.cn
中央财经大学|Central University of Finance and Economics|北京|cufe.edu.cn
对外经济贸易大学|University of International Business and Economics|北京|uibe.edu.cn
中国政法大学|China University of Political Science and Law|北京|cupl.edu.cn
北京体育大学|Beijing Sport University|北京|bsu.edu.cn
中央音乐学院|Central Conservatory of Music|北京|ccom.edu.cn
华北电力大学|North China Electric Power University|北京 / 保定|ncepu.edu.cn
中国矿业大学（北京）|China University of Mining and Technology Beijing|北京|cumtb.edu.cn
中国石油大学（北京）|China University of Petroleum Beijing|北京|cup.edu.cn
中国地质大学（北京）|China University of Geosciences Beijing|北京|cugb.edu.cn
南开大学|Nankai University|天津|nankai.edu.cn
天津大学|Tianjin University|天津|tju.edu.cn
天津医科大学|Tianjin Medical University|天津|tmu.edu.cn
河北工业大学|Hebei University of Technology|天津|hebut.edu.cn
太原理工大学|Taiyuan University of Technology|太原|tyut.edu.cn
内蒙古大学|Inner Mongolia University|呼和浩特|imu.edu.cn
大连理工大学|Dalian University of Technology|大连|dlut.edu.cn
东北大学|Northeastern University|沈阳|neu.edu.cn
辽宁大学|Liaoning University|沈阳|lnu.edu.cn
大连海事大学|Dalian Maritime University|大连|dlmu.edu.cn
吉林大学|Jilin University|长春|jlu.edu.cn
东北师范大学|Northeast Normal University|长春|nenu.edu.cn
延边大学|Yanbian University|延吉|ybu.edu.cn
哈尔滨工业大学|Harbin Institute of Technology|哈尔滨|hit.edu.cn
哈尔滨工程大学|Harbin Engineering University|哈尔滨|hrbeu.edu.cn
东北农业大学|Northeast Agricultural University|哈尔滨|neau.edu.cn
东北林业大学|Northeast Forestry University|哈尔滨|nefu.edu.cn
复旦大学|Fudan University|上海|fudan.edu.cn
上海交通大学|Shanghai Jiao Tong University|上海|sjtu.edu.cn
同济大学|Tongji University|上海|tongji.edu.cn
华东师范大学|East China Normal University|上海|ecnu.edu.cn
华东理工大学|East China University of Science and Technology|上海|ecust.edu.cn
东华大学|Donghua University|上海|dhu.edu.cn
上海外国语大学|Shanghai International Studies University|上海|shisu.edu.cn
上海财经大学|Shanghai University of Finance and Economics|上海|shufe.edu.cn
上海大学|Shanghai University|上海|shu.edu.cn
南京大学|Nanjing University|南京|nju.edu.cn
东南大学|Southeast University|南京|seu.edu.cn
苏州大学|Soochow University|苏州|suda.edu.cn
南京航空航天大学|Nanjing University of Aeronautics and Astronautics|南京|nuaa.edu.cn
南京理工大学|Nanjing University of Science and Technology|南京|njust.edu.cn
中国矿业大学|China University of Mining and Technology|徐州|cumt.edu.cn
河海大学|Hohai University|南京|hhu.edu.cn
江南大学|Jiangnan University|无锡|jiangnan.edu.cn
南京农业大学|Nanjing Agricultural University|南京|njau.edu.cn
中国药科大学|China Pharmaceutical University|南京|cpu.edu.cn
南京师范大学|Nanjing Normal University|南京|njnu.edu.cn
浙江大学|Zhejiang University|杭州|zju.edu.cn
中国科学技术大学|University of Science and Technology of China|合肥|ustc.edu.cn
安徽大学|Anhui University|合肥|ahu.edu.cn
合肥工业大学|Hefei University of Technology|合肥|hfut.edu.cn
厦门大学|Xiamen University|厦门|xmu.edu.cn
福州大学|Fuzhou University|福州|fzu.edu.cn
南昌大学|Nanchang University|南昌|ncu.edu.cn
山东大学|Shandong University|济南|sdu.edu.cn
中国海洋大学|Ocean University of China|青岛|ouc.edu.cn
中国石油大学（华东）|China University of Petroleum East China|青岛|upc.edu.cn
郑州大学|Zhengzhou University|郑州|zzu.edu.cn
武汉大学|Wuhan University|武汉|whu.edu.cn
华中科技大学|Huazhong University of Science and Technology|武汉|hust.edu.cn
中国地质大学（武汉）|China University of Geosciences Wuhan|武汉|cug.edu.cn
武汉理工大学|Wuhan University of Technology|武汉|whut.edu.cn
华中农业大学|Huazhong Agricultural University|武汉|hzau.edu.cn
华中师范大学|Central China Normal University|武汉|ccnu.edu.cn
中南财经政法大学|Zhongnan University of Economics and Law|武汉|zuel.edu.cn
湖南大学|Hunan University|长沙|hnu.edu.cn
中南大学|Central South University|长沙|csu.edu.cn
湖南师范大学|Hunan Normal University|长沙|hunnu.edu.cn
中山大学|Sun Yat-sen University|广州|sysu.edu.cn
华南理工大学|South China University of Technology|广州|scut.edu.cn
暨南大学|Jinan University|广州|jnu.edu.cn
华南师范大学|South China Normal University|广州|scnu.edu.cn
广西大学|Guangxi University|南宁|gxu.edu.cn
海南大学|Hainan University|海口|hainanu.edu.cn
重庆大学|Chongqing University|重庆|cqu.edu.cn
西南大学|Southwest University|重庆|swu.edu.cn
四川大学|Sichuan University|成都|scu.edu.cn
电子科技大学|University of Electronic Science and Technology of China|成都|uestc.edu.cn
西南交通大学|Southwest Jiaotong University|成都|swjtu.edu.cn
四川农业大学|Sichuan Agricultural University|雅安 / 成都|sicau.edu.cn
西南财经大学|Southwestern University of Finance and Economics|成都|swufe.edu.cn
贵州大学|Guizhou University|贵阳|gzu.edu.cn
云南大学|Yunnan University|昆明|ynu.edu.cn
西藏大学|Tibet University|拉萨|utibet.edu.cn
西安交通大学|Xi'an Jiaotong University|西安|xjtu.edu.cn
西北工业大学|Northwestern Polytechnical University|西安|nwpu.edu.cn
西北农林科技大学|Northwest A&F University|杨凌|nwafu.edu.cn
西北大学|Northwest University|西安|nwu.edu.cn
西安电子科技大学|Xidian University|西安|xidian.edu.cn
长安大学|Chang'an University|西安|chd.edu.cn
陕西师范大学|Shaanxi Normal University|西安|snnu.edu.cn
兰州大学|Lanzhou University|兰州|lzu.edu.cn
青海大学|Qinghai University|西宁|qhu.edu.cn
宁夏大学|Ningxia University|银川|nxu.edu.cn
新疆大学|Xinjiang University|乌鲁木齐|xju.edu.cn
石河子大学|Shihezi University|石河子|shzu.edu.cn
国防科技大学|National University of Defense Technology|长沙|nudt.edu.cn
海军军医大学|Naval Medical University|上海|smmu.edu.cn
空军军医大学|Air Force Medical University|西安|fmmu.edu.cn'''
N985=set('北京大学 清华大学 中国人民大学 北京师范大学 北京航空航天大学 北京理工大学 中国农业大学 中央民族大学 南开大学 天津大学 大连理工大学 东北大学 吉林大学 哈尔滨工业大学 复旦大学 上海交通大学 同济大学 华东师范大学 南京大学 东南大学 浙江大学 中国科学技术大学 厦门大学 山东大学 中国海洋大学 武汉大学 华中科技大学 湖南大学 中南大学 中山大学 华南理工大学 重庆大学 四川大学 电子科技大学 西安交通大学 西北工业大学 西北农林科技大学 兰州大学 国防科技大学'.split())
source=lambda url,title,year:{'url':url,'title':title,'year':year,'checkedAt':CHECK}
cat=[]
for i,line in enumerate(rows.splitlines(),1):
 zh,en,city,domain=line.split('|')
 military=zh in ['国防科技大学','海军军医大学','空军军医大学']
 cat.append({'id':'cn-'+domain.split('.')[0], 'nameZh':zh,'nameEn':en,'city':city,'country':'China','classification985':zh in N985,'classification211':True,'military':military,'officialUrl':'https://www.'+domain+'/', 'admissionsUrl':None,'verificationStatus':'not_verified','internationalUndergraduateAvailability':'not_verified' if not military else 'military_requires_separate_confirmation','sources':[], 'requirements':{k:{'status':'unknown','reason':'尚未核实具体学历认可与本科招生规则'} for k in ['matriculation','chineseSchool','ged','alevel']},'rules':[]})
by={x['nameZh']:x for x in cat}
def verify(zh,url,title,year,evidence,rules,extra=[]):
 x=by[zh];x.update(admissionsUrl=url,verificationStatus='verified_general_requirements',internationalUndergraduateAvailability='confirmed',sources=[source(url,title,year)]+extra,evidenceParaphrase=evidence)
 x['requirements']={k:{'status':'conditional' if k!='ged' else 'unknown','reason':'官网要求认可的高中毕业学历与完整成绩单；未逐项明确缅甸该类文凭，需学校审核学历与大学入学资格' if k!='ged' else '官网未明确GED可单独替代高中毕业证；须招生办书面确认'} for k in ['matriculation','chineseSchool','ged','alevel']}
 for r in rules:
  r.update(year=year,qualification=x['requirements'],qualificationReviewRequired=True,sourceUrl=url,otherRequirements=r.get('otherRequirements',[])+['高中毕业证（或预毕业证明并按时补交）、高中成绩单、非中国籍资格审核；按学校要求完成综合审查'])
 x['rules']=rules

def rule(id,label,lang,hsk=None,ielts=None,csca=None,age=None,notes=[]):
 r={'id':id,'label':label,'teachingLanguage':lang,'machineRule':{},'otherRequirements':notes}
 if hsk:r['machineRule']['hsk']=hsk
 if ielts:r['machineRule']['ielts']=ielts
 if csca is not None:r['machineRule']['csca']={'required':True,'subjects':csca,'minimumScore':None,'scoreThresholdPublished':False,'subjectReviewRequired':not bool(csca)}
 if age:r['machineRule']['age']=age
 return r
verify('清华大学','https://international.join-tsinghua.edu.cn/info/1024/1023.htm','Eligibility: International Undergraduate Admissions 2027',2027,'要求全日制线下完成高中教育；承认国际考试成绩作为学业证据，列举A-Level、CSCA等；中英双语项目HSK5以上且听读写各超过60；英语成绩须提交但此通用页无统一IELTS分数。',[rule('thu-bilingual','中英双语本科项目','zh-en',{'minimumLevel':5,'sections':{'listening':{'minimum':60,'exclusive':True},'reading':{'minimum':60,'exclusive':True},'writing':{'minimum':60,'exclusive':True}}},notes=['英语能力证明必交，具体项目另有标准；CSCA列为可提供的国际考试，非此页统一强制条件','高中教育必须全日制且线下完成；华校授课证明申请HSK豁免仍须清华批准']),rule('thu-en','英语授课本科项目','en',notes=['需官方英语能力成绩，具体项目阈值另核实；通用页未设IELTS数字标准'])])
verify('上海交通大学','https://isc.sjtu.edu.cn/CN/show.aspx?info_id=1671&info_lb=133','2026上海交通大学国际本科生中文项目',2026,'中文项目需HSK5 200且书写60，或HSK6 180且书写60；需CSCA。医学院另行招生。',[rule('sjtu-cn','中文授课本科（医学院另行招生）','zh',{'alternatives':[{'minimumLevel':5,'minimumTotal':200,'writingMinimum':60},{'minimumLevel':6,'minimumTotal':180,'writingMinimum':60}]},csca=[],notes=['高中汉语授课等豁免材料须经校方核准','CSCA科目依具体专业；需英文能力证明，不能只检查HSK'])])
verify('浙江大学','https://iczu.zju.edu.cn/admissionsen/2024/1030/c68988a2981659/page.htm','Application Guide for Undergraduate Programs 2026',2026,'25岁以下，须高中毕业；2026/2027起本科国际生需CSCA；高中与初中必修课汉语授课可凭证明申请HSK豁免；语言分数须按专业目录查。',[rule('zju-general','本科通用要求（专业另核）','zh',csca=[],age={'maximum':25,'exclusive':True},notes=['通用简章无统一HSK总分；需查看拟选专业目录','初中和高中必修课程授课语言均为汉语才符合此页豁免条件']),rule('zju-gcm','Global Communication and Management（英语）','en',ielts={'overallMinimum':6.5},csca=['mathematics'],age={'maximum':25,'exclusive':True},notes=['CSCA数学必须英语试卷；IELTS Academic；TOEFL80可替代；母语英语可豁免'])],[source('https://zibs.zju.edu.cn/enzibs/UndergraduateApplication/list.psp','Global Communication and Management undergraduate application',2026)])
verify('华中科技大学','https://iso.hust.edu.cn/info/1194/4638.htm','2026 HUST Application Guide for International Undergraduate Students',2026,'要求高中毕业、成绩单及CSCA；中文理工医HSK4 180，人文经管及人工智能学院HSK5 180；英语IELTS5.5。',[rule('hust-stem','中文理工医本科（人工智能学院除外）','zh',{'minimumLevel':4,'minimumTotal':180},csca=[]),rule('hust-humanities','中文经管人文及人工智能学院','zh',{'minimumLevel':5,'minimumTotal':180},csca=[]),rule('hust-en','英文授课本科','en',ielts={'overallMinimum':5.5},csca=[],notes=['TOEFL80或校方认可的其他英语证明可替代；前置学历英语授课/英语母语经确认可豁免'])])
verify('厦门大学','https://admissions.xmu.edu.cn/cn/info/1019/2036.htm','厦门大学2026年国际学生本科招生简章',2026,'高中毕业且具有大学申请资格；本科CSCA数学必考，中文项目专业中文必考，理工农医物理化学至少一门；中文人文经管法艺HSK5 210、理工医体育HSK4 210；英语IELTS6。',[rule('xmu-humanities','中文人文社科、经管法、艺术本科','zh',{'minimumLevel':5,'minimumTotal':210},csca=['mathematics','chineseHumanities'],age={'maximum':30},notes=['汉语言专业另查学院要求；高中中文授课证明可替代HSK']),rule('xmu-stem','中文理工医、体育本科','zh',{'minimumLevel':4,'minimumTotal':210},csca=['mathematics','chineseStem'],age={'maximum':30},notes=['理工农医还须CSCA物理/化学至少一门；体育专业科目依目录']),rule('xmu-en','英语授课本科','en',ielts={'overallMinimum':6},csca=['mathematics'],age={'maximum':30},notes=['理工农医CSCA物理/化学至少一门；测试语言与授课一致；英语授课证明经学校认可可替代'])])
verify('天津大学','https://sie.tju.edu.cn/en/xwxm/UNDERGRADUATE/202609/t20260930_324729.html','Tianjin University undergraduate admissions: 2027 application window',2027,'新简章窗口2026年9月30日至2027年5月31日；年龄25岁以下；一般中文HSK5 180，国际教育学院HSK4 180；英语IELTS6；需CSCA，科目另表。官网年龄段仍有2026字样，2027监护材料条款已更新。',[rule('tju-cn','中文授课本科（国际教育学院除外）','zh',{'minimumLevel':5,'minimumTotal':180},csca=[],age={'maximum':25,'exclusive':True}),rule('tju-sie','国际教育学院本科','zh',{'minimumLevel':4,'minimumTotal':180},csca=[],age={'maximum':25,'exclusive':True}),rule('tju-en','英文授课本科','en',ielts={'overallMinimum':6},csca=[],age={'maximum':25,'exclusive':True},notes=['高中英文授课证明可替代IELTS；中文授课毕业证明可申请HSK豁免'])])
verify('中南大学','https://intl.csu.edu.cn/info/1075/3804.htm','2026年中南大学国际学生本科生（中文授课）招生简章',2026,'须高中学历且提交CSCA规定科目；理工HSK4 260；医学和其他文科HSK5 200；相应汉语授课经历可凭证明申请豁免。',[rule('csu-stem','中文理工科本科','zh',{'minimumLevel':4,'minimumTotal':260},csca=[]),rule('csu-humanities-med','中文医学和文科本科','zh',{'minimumLevel':5,'minimumTotal':200},csca=[])])
verify('华东师范大学','https://lxs.ecnu.edu.cn/cn_admission_degree_programs_undergraduate_program/list.htm','2026年华东师范大学国际学生本科招生',2026,'英语、国际汉语文化学院及设计学院中文专业HSK4 180，传播学院HSK6 180，其余中文HSK5 180；CSCA无2026最低分数线，作为综合评估参考。',[rule('ecnu-general','一般中文本科（特殊学院另列）','zh',{'minimumLevel':5,'minimumTotal':180},csca=[]),rule('ecnu-special','英语/国际汉语文化学院/设计学院中文专业','zh',{'minimumLevel':4,'minimumTotal':180},csca=[]),rule('ecnu-communication','传播学院中文本科','zh',{'minimumLevel':6,'minimumTotal':180},csca=[])])
data={'schemaVersion':1,'country':'China','checkedAt':CHECK,'planningIntakeYear':2027,'classificationNote':'985/211为历史建设项目标签，不等于国际学生招生资格。教育部历史口径211为112所、985为39所；本目录把矿业、石油、地质在北京和外地的独立招生学校分列，并将华北电力北京/保定合为一校，不重复分校区。军校不进入普通国际生自动匹配。','catalogSources':[source(MOE211,'教育部211工程历史学校名单（正文抓取受限；交叉核对阳光高考及高校官方历史目录）',2005),source(MOE985,'教育部985工程学校名单',2006),source('https://gaokao.chsi.com.cn/gkxx/gxmd/211gc.shtml','教育部阳光高考211工程学校目录',2008),source('https://nuaa.edu.cn/2012/0102/c14607a126917/page.htm','南京航空航天大学官网：211工程名单截止2011-03-31',2012)],'matchingPolicy':['仅有官方数字的语言和年龄条件可机器检查；语言达标不能证明学校认可该文凭','Matriculation、华校毕业、GED需核实文凭颁发机构、完整高中教育及大学入学资格；不编造缅甸分数录取线','2026规则仅用于2027规划参考，须显示年度并等待新简章；2027已发布规则按来源显示','竞赛是综合审查补充材料，不推导任意加分或录取概率','CSCA需按专业核实科目，未公布最低分时不自行设阈值'],'universities':cat}
data['stats']={'directoryEntries':len(cat),'classification985':sum(x['classification985'] for x in cat),'classification211':len(cat),'verifiedUniversities':sum(x['verificationStatus']!='not_verified' for x in cat),'projectRules':sum(len(x['rules']) for x in cat),'militaryEntries':sum(x['military'] for x in cat)}
Path(__file__).with_name('china.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
print(data['stats'])
