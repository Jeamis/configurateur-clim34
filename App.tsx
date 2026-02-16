import React, { useState, useRef, useEffect } from 'react';
import { FormData, Step, Product } from './types';
import { INITIAL_DATA, PRODUCTS } from './constants';
import { StepLayout } from './components/StepLayout';
import { SelectionCard } from './components/SelectionCard';
import { Button } from './components/Button';
import { 
  Home, Grip, ThermometerSun, Snowflake, Zap, ArrowRight, ArrowLeft, 
  MapPin, Flame, Factory, Banknote, Mail, Phone, User, CheckCircle, Info,
  RefreshCw, Ruler, AlertCircle, Droplets, ChevronRight
} from 'lucide-react';

export default function App() {
  const [step, setStep] = useState<Step>('P1_ROOMS');
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const topRef = useRef<HTMLDivElement>(null);

  // Scroll to top on step change
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [step]);

  const updateData = (updates: Partial<FormData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setData(INITIAL_DATA);
    setStep('P1_ROOMS');
  };

  // --- Navigation Logic ---
  const goBack = () => {
    const flow: Step[] = [
      'P1_ROOMS', 'P1_NEEDS', 'P1_UNIT_TYPE', 'P1_SURFACE', 'P1_PRODUCT',
      'P2_LOCATION', 'P2_GENERATOR', 
      ...(data.generatorType === 'boiler' ? ['P2_BOILER_TYPE' as Step] : []),
      'P2_FUEL_TYPE', 'P2_KNOW_CONSUMPTION', 'P2_CONSUMPTION_AMOUNT', 'P2_ENERGY_COST', 'FINAL_FORM'
    ];
    
    // Simple reverse lookup isn't enough due to conditionals, but for this linear path:
    if (step === 'P2_BOILER_TYPE') { setStep('P2_GENERATOR'); return; }
    if (step === 'P2_FUEL_TYPE') { 
        if (data.generatorType === 'boiler') setStep('P2_BOILER_TYPE');
        else setStep('P2_GENERATOR');
        return;
    }

    // Default sequential back
    const currentIndex = flow.indexOf(step);
    if (currentIndex > 0) {
      setStep(flow[currentIndex - 1]);
    }
  };

  const nextStep = (target?: Step) => {
    if (target) {
      setStep(target);
      return;
    }
    
    // Default Flow
    switch (step) {
      case 'P1_ROOMS': setStep('P1_NEEDS'); break;
      case 'P1_NEEDS': setStep('P1_UNIT_TYPE'); break;
      case 'P1_UNIT_TYPE': setStep('P1_SURFACE'); break;
      case 'P1_SURFACE': setStep('P1_PRODUCT'); break;
      case 'P1_PRODUCT': setStep('P2_LOCATION'); break;
      case 'P2_LOCATION': setStep('P2_GENERATOR'); break;
      case 'P2_GENERATOR': 
        if (data.generatorType === 'boiler') setStep('P2_BOILER_TYPE');
        else setStep('P2_FUEL_TYPE'); 
        break;
      case 'P2_BOILER_TYPE': setStep('P2_FUEL_TYPE'); break;
      case 'P2_FUEL_TYPE': setStep('P2_KNOW_CONSUMPTION'); break;
      case 'P2_KNOW_CONSUMPTION': 
        if (data.knowsConsumption) setStep('P2_CONSUMPTION_AMOUNT');
        else setStep('P2_ENERGY_COST'); // Skip amount if unknown, go to estimate/cost
        break;
      case 'P2_CONSUMPTION_AMOUNT': setStep('P2_ENERGY_COST'); break;
      case 'P2_ENERGY_COST': setStep('FINAL_FORM'); break;
      default: break;
    }
  };

  // --- Render Helpers ---
  const getPhaseTitle = () => {
    if (step.startsWith('P1')) return '1. PHASE DE SÉLECTION';
    if (step.startsWith('P2')) return '2. DIMENSIONNEMENT ET PRIX';
    return '3. RÉCAPITULATIF';
  };

  const filteredProducts = PRODUCTS.filter(p => {
    // 1. Filter by Type
    if (p.type !== data.unitType) return false;

    // 2. Filter by Need (Strict safety check)
    // If user wants ONLY cooling, do not show Air-Water units (which are primarily heating systems)
    if (data.need === 'cooling' && p.type === 'air-water') return false;

    // 2. Filter by Surface
    // For Air-Water, we generally size based on the whole house surface.
    // For Air-Air (Wall, Console, Ducted), we often look at the room size if mono-split, 
    // but Ducted is often whole house too.
    // However, the provided data for Wall/Console has ranges like 20-50m2 (Room size logic).
    // Air-Water has 100-250m2 (House size logic).
    
    let surfaceToCompare = data.surfaceRoom;
    
    if (data.unitType === 'air-water') {
        surfaceToCompare = data.surfaceHouse;
    } else if (data.unitType === 'ducted') {
        // Ducted often covers multiple rooms/zones, but let's stick to the rule: 
        // if user selected "1 Room" -> Room Surface.
        // if user selected "Multiple" -> Usually we still pick indoor units based on avg room size or just show all compatible.
        // For simplicity, let's use Room Surface for now, as ranges are small (15-50m2) for some ducted units (FDXS).
        // BUT Shogun is 120m2. 
        // Heuristic: if p.maxSurface > 80, compare with House Surface? 
        // Safer: compare with whichever fits best. 
        // Let's stick to: if maxSurface is large (>80), compare against house.
        if (p.maxSurface > 80) surfaceToCompare = data.surfaceHouse;
        else surfaceToCompare = data.surfaceRoom;
    }

    // Logic: The product is suitable if the surface is <= maxSurface.
    // We also want to avoid showing massive units for tiny rooms, so maybe surface >= minSurface (with tolerance).
    const fitsMax = surfaceToCompare <= (p.maxSurface * 1.2); // +20% tolerance
    const fitsMin = surfaceToCompare >= (p.minSurface * 0.5); // Tolerance for small rooms
    
    return fitsMax && fitsMin;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
             {/* Logo - Left aligned on desktop */}
             <a href="https://www.clim34.fr/" className="flex-shrink-0">
               <img 
                 src="https://www.clim34.fr/images/logo.png" 
                 alt="Froid Sud Energie" 
                 className="h-12 md:h-16 object-contain"
                 onError={(e) => {
                   // Fallback if image fails to load
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.parentElement!.innerText = 'FROID SUD ENERGIE';
                 }}
               />
             </a>

             {/* Contact Info - Right aligned on desktop */}
             <div className="flex flex-col items-center md:items-end text-center md:text-right">
                <p className="text-[11px] md:text-xs font-bold text-slate-900 leading-tight">
                  Installations et interventions à Montpellier <br className="hidden md:inline"/>
                  et région 34 Hérault, contactez-nous au
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mt-1">
                   <a href="tel:0970468458" className="text-lg md:text-xl font-bold text-[#cc0000] hover:opacity-80 transition-opacity whitespace-nowrap">
                      0970 468 458 <span className="text-xs font-normal text-slate-600">(non surtaxé)</span>
                   </a>
                   <span className="text-sm font-medium text-slate-600 hidden sm:inline">ou</span>
                   <a href="tel:0601765885" className="text-lg md:text-xl font-bold text-[#009fe3] hover:opacity-80 transition-opacity">
                      06 01 76 58 85
                   </a>
                </div>
             </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-50 h-10 border-t border-b border-gray-200 flex items-center justify-center text-xs md:text-sm font-medium text-slate-500 gap-4 md:gap-8 shadow-inner">
           <div className={`flex items-center gap-2 ${step.startsWith('P1') ? 'text-brand-blue' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step.startsWith('P1') ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-300'}`}>1</div>
              <span>SÉLECTION</span>
           </div>
           <div className={`flex items-center gap-2 ${step.startsWith('P2') ? 'text-brand-blue' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step.startsWith('P2') ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-300'}`}>2</div>
              <span>DIMENSIONNEMENT</span>
           </div>
           <div className={`flex items-center gap-2 ${step === 'FINAL_FORM' ? 'text-brand-blue' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === 'FINAL_FORM' ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-300'}`}>3</div>
              <span>CONTACT</span>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-slate-50 p-4 md:p-8" ref={topRef}>
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm min-h-[600px] p-6 md:p-12 relative mb-12">
          
          <div className="mb-6">
             <span className="text-brand-blue font-bold tracking-wider text-xs uppercase">{getPhaseTitle()}</span>
          </div>

          {/* --- STEP: P1_ROOMS --- */}
          {step === 'P1_ROOMS' && (
            <StepLayout 
              title="Combien de pièces souhaitez-vous équiper ?"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <SelectionCard 
                  selected={data.rooms === '1'}
                  onClick={() => { updateData({ rooms: '1' }); setTimeout(() => nextStep(), 300); }}
                  label="1 pièce (Mono-split)"
                  icon={<div className="w-16 h-16 border-2 border-current rounded flex items-center justify-center"><div className="w-10 h-10 border-2 border-current" /></div>}
                />
                <SelectionCard 
                  selected={data.rooms === 'multiple'}
                  onClick={() => { updateData({ rooms: 'multiple' }); setTimeout(() => nextStep(), 300); }}
                  label="Plusieurs pièces (Multi-split)"
                  icon={<div className="w-16 h-16 border-2 border-current rounded flex items-center justify-center relative"><div className="absolute top-2 left-2 w-6 h-6 border border-current"/><div className="absolute bottom-2 right-2 w-6 h-6 border border-current"/></div>}
                />
              </div>
            </StepLayout>
          )}

          {/* --- STEP: P1_NEEDS --- */}
          {step === 'P1_NEEDS' && (
            <StepLayout 
              title="Quel est votre besoin principal : chauffage ou climatisation ?"
              subtitle="En fonction de vos attentes, nous vous proposerons la solution la plus adaptée."
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectionCard 
                  selected={data.need === 'heating'}
                  onClick={() => { 
                    // Reset downstream choices when need changes
                    updateData({ need: 'heating', unitType: null, selectedProduct: null }); 
                  }}
                  label="Chauffage en hiver"
                  icon={<ThermometerSun className="w-12 h-12" />}
                />
                <SelectionCard 
                  selected={data.need === 'cooling'}
                  onClick={() => { 
                     // Reset downstream choices when need changes
                    updateData({ need: 'cooling', unitType: null, selectedProduct: null }); 
                  }}
                  label="Rafraîchissement en été"
                  icon={<Snowflake className="w-12 h-12" />}
                />
                 <SelectionCard 
                  selected={data.need === 'both'}
                  onClick={() => { 
                     // Reset downstream choices when need changes
                    updateData({ need: 'both', unitType: null, selectedProduct: null }); 
                  }}
                  label="Chauffage & Climatisation"
                  icon={<div className="flex"><ThermometerSun className="w-8 h-8 mr-1"/><Snowflake className="w-8 h-8"/></div>}
                  description="Solution réversible complète"
                />
              </div>
              <div className="mt-8 flex justify-end">
                <Button disabled={!data.need} onClick={() => nextStep()}>Suivant <ArrowRight size={16}/></Button>
              </div>
            </StepLayout>
          )}

          {/* --- STEP: P1_UNIT_TYPE --- */}
          {step === 'P1_UNIT_TYPE' && (
            <StepLayout 
              title="Quel type d'unité intérieure préférez-vous ?"
              subtitle={
                data.need === 'heating' 
                  ? "Pour un confort optimal en mode chauffage, les Consoles et PAC Air-Eau sont recommandées."
                  : data.need === 'cooling'
                  ? "Pour le rafraîchissement, les unités Murales et Gainables sont les plus efficaces."
                  : "Pour une solution réversible complète, choisissez selon l'intégration souhaitée."
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SelectionCard 
                  selected={data.unitType === 'wall'}
                  onClick={() => updateData({ unitType: 'wall' })}
                  label="Mural"
                  description="Idéal pour une installation au-dessus d'une porte."
                  icon={<div className="w-16 h-10 border-2 border-current rounded-lg mx-auto mb-2" />}
                />
                <SelectionCard 
                  selected={data.unitType === 'console'}
                  onClick={() => updateData({ unitType: 'console' })}
                  label="Console"
                  description="Pour une installation au sol, similaire à un radiateur (Top Chauffage)."
                  icon={<div className="w-12 h-12 border-2 border-current rounded mx-auto mb-2" />}
                />
                <SelectionCard 
                  selected={data.unitType === 'ducted'}
                  onClick={() => updateData({ unitType: 'ducted' })}
                  label="Gainable"
                  description="Dissimulée dans le plafond : seules les grilles sont visibles."
                  icon={<div className="w-16 h-6 border-2 border-dashed border-current mx-auto mb-2 mt-4" />}
                />
                
                {/* Hide Air-Water if the user wants ONLY cooling, as these are primarily heating replacement systems */}
                {data.need !== 'cooling' && (
                  <SelectionCard 
                    selected={data.unitType === 'air-water'}
                    onClick={() => updateData({ unitType: 'air-water' })}
                    label="PAC Air-Eau"
                    description="Pour radiateurs ou plancher chauffant (Remplacement Chaudière)."
                    icon={<Droplets className="w-12 h-12 mx-auto" />}
                  />
                )}
              </div>
              <div className="mt-8 flex justify-between max-w-4xl mx-auto w-full">
                <Button variant="ghost" onClick={goBack}><ArrowLeft size={16}/> Retour</Button>
                <Button disabled={!data.unitType} onClick={() => nextStep()}>Suivant <ArrowRight size={16}/></Button>
              </div>
            </StepLayout>
          )}

          {/* --- STEP: P1_SURFACE --- */}
          {step === 'P1_SURFACE' && (
             <StepLayout title="Quelle est la surface (chauffée) de la pièce et de la maison ?">
               <div className="max-w-2xl mx-auto space-y-12 py-8">
                 <div className="bg-slate-50 p-6 rounded-lg">
                    <div className="flex justify-between mb-4">
                      <label className="font-medium text-slate-700 flex items-center gap-2"><Grip size={18}/> Taille de la pièce</label>
                      <span className="text-brand-blue font-bold text-xl">{data.surfaceRoom}m²</span>
                    </div>
                    <input 
                      type="range" min="10" max="100" step="5"
                      value={data.surfaceRoom}
                      onChange={(e) => updateData({ surfaceRoom: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                    />
                 </div>

                 <div className="bg-slate-50 p-6 rounded-lg">
                    <div className="flex justify-between mb-4">
                      <label className="font-medium text-slate-700 flex items-center gap-2"><Home size={18}/> Surface de la maison</label>
                      <span className="text-brand-blue font-bold text-xl">{data.surfaceHouse}m²</span>
                    </div>
                    <input 
                      type="range" min="30" max="300" step="10"
                      value={data.surfaceHouse}
                      onChange={(e) => updateData({ surfaceHouse: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                    />
                 </div>
               </div>
               <div className="mt-8 flex justify-between max-w-4xl mx-auto w-full">
                <Button variant="ghost" onClick={goBack}><ArrowLeft size={16}/> Retour</Button>
                <Button onClick={() => nextStep()}>Suivant <ArrowRight size={16}/></Button>
              </div>
             </StepLayout>
          )}

          {/* --- STEP: P1_PRODUCT --- */}
          {step === 'P1_PRODUCT' && (
             <StepLayout title="Sélectionnez votre produit préféré">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                     <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4"/>
                     <p className="text-lg text-slate-600">Aucun produit standard ne correspond exactement à vos critères de surface.</p>
                     <p className="text-sm text-slate-500 mt-2">Surface actuelle : {data.unitType === 'air-water' ? data.surfaceHouse : data.surfaceRoom} m².</p>
                     <p className="text-sm text-slate-500 mt-2">Veuillez nous contacter directement pour une solution sur mesure ou ajuster la surface.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                      <div 
                        key={product.id}
                        onClick={() => updateData({ selectedProduct: product })}
                        className={`
                          border rounded-xl p-4 cursor-pointer transition-all duration-300 flex flex-col relative
                          ${data.selectedProduct?.id === product.id ? 'border-brand-blue ring-2 ring-brand-blue ring-opacity-50 shadow-lg' : 'border-gray-200 hover:shadow-md hover:border-brand-blue/50'}
                        `}
                      >
                        <div className="bg-gray-100 rounded-lg h-32 mb-4 overflow-hidden relative group">
                           <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                           {product.name.includes('Perfera') && (
                             <div className="absolute top-0 right-0 bg-brand-blue text-white text-[10px] px-2 py-1 uppercase font-bold">Populaire</div>
                           )}
                           <div className="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-2 py-1 w-full text-center backdrop-blur-sm">
                              {product.series}
                           </div>
                        </div>
                        <h3 className="font-bold text-slate-800 text-center text-lg leading-tight">{product.name}</h3>
                        
                        <div className="flex justify-center items-center gap-1 my-2">
                          <span className="text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200">
                            {product.energyLabel}
                          </span>
                           <div className="flex text-yellow-400">
                             {[...Array(5)].map((_, i) => (
                               <svg key={i} className={`w-3 h-3 ${i < product.stars ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                             ))}
                           </div>
                        </div>

                        {product.dimensions && (
                           <p className="text-xs text-center text-slate-400 mb-2 flex items-center justify-center gap-1">
                             <Ruler size={12}/> {product.dimensions}
                           </p>
                        )}

                        <div className="text-center text-brand-blue font-bold mb-3 text-lg">
                          {product.priceStart > 0 ? `${product.priceStart} €*` : 'Sur devis'}
                        </div>
                        
                        <div className="mt-auto space-y-2">
                          <ul className="text-[10px] text-slate-600 space-y-1">
                            {product.features.map((f, i) => (
                               <li key={i} className="flex items-start gap-1">
                                 <CheckCircle size={10} className="text-brand-blue shrink-0 mt-0.5"/> 
                                 <span className="leading-tight">{f}</span>
                               </li>
                            ))}
                          </ul>
                          <button className={`w-full py-2 rounded text-xs font-bold uppercase transition-colors mt-3 ${data.selectedProduct?.id === product.id ? 'bg-brand-blue text-white shadow-md' : 'bg-gray-100 text-slate-600 group-hover:bg-brand-blue/10'}`}>
                            {data.selectedProduct?.id === product.id ? 'Sélectionné' : 'Choisir ce modèle'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {data.rooms === 'multiple' && (
                  <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                     <p className="font-bold flex items-center gap-2 mb-1"><Info size={16}/> Information Multi-Split</p>
                     <p>
                       Puisque vous avez sélectionné "Plusieurs pièces", votre installation comprendra un groupe extérieur Multi-Split adapté (Ex: Daikin MXM-N, Mitsubishi MXZ-F) 
                       capable de relier toutes vos unités intérieures. Le dimensionnement exact sera confirmé lors du devis technique.
                     </p>
                  </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-6">*Prix estimatif matériel hors pose. TVA réduite applicable selon éligibilité.</p>
                
                <div className="mt-8 flex justify-between max-w-full mx-auto w-full">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft size={16}/> Retour</Button>
                  <Button disabled={!data.selectedProduct} onClick={() => nextStep()}>Suivant <ArrowRight size={16}/></Button>
                </div>
             </StepLayout>
          )}

          {/* --- STEP: P2_LOCATION --- */}
          {step === 'P2_LOCATION' && (
             <StepLayout 
                title="Merci de renseigner votre code postal"
                subtitle="Nous en avons besoin pour connaître votre zone climatique."
              >
                <div className="max-w-md mx-auto">
                   <div className="bg-slate-100 p-8 rounded-xl flex flex-col items-center">
                      <MapPin className="w-12 h-12 text-brand-blue mb-4" />
                      <label className="block text-sm font-medium text-slate-700 mb-2">Code postal</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 13008" 
                        maxLength={5}
                        value={data.zipCode}
                        onChange={(e) => updateData({ zipCode: e.target.value.replace(/\D/g,'') })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none text-center text-lg tracking-widest"
                      />
                   </div>
                </div>
                <div className="mt-8 flex justify-between max-w-4xl mx-auto w-full">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft size={16}/> Retour</Button>
                  <Button disabled={data.zipCode.length < 4} onClick={() => nextStep()}>Suivant <ArrowRight size={16}/></Button>
                </div>
             </StepLayout>
          )}

          {/* --- STEP: P2_GENERATOR --- */}
          {step === 'P2_GENERATOR' && (
            <StepLayout title="Quel type de générateur de chaleur utilisez-vous ?">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                 <SelectionCard 
                   selected={data.generatorType === 'boiler'}
                   onClick={() => updateData({ generatorType: 'boiler' })}
                   label="Chaudière"
                   icon={<Flame className="w-12 h-12"/>}
                 />
                 <SelectionCard 
                   selected={data.generatorType === 'electric'}
                   onClick={() => updateData({ generatorType: 'electric' })}
                   label="Chauffage électrique"
                   icon={<Zap className="w-12 h-12"/>}
                 />
              </div>
              <div className="mt-8 flex justify-between max-w-4xl mx-auto w-full">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft size={16}/> Retour</Button>
                  <Button disabled={!data.generatorType} onClick={() => nextStep()}>Suivant <ArrowRight size={16}/></Button>
                </div>
            </StepLayout>
          )}

           {/* --- STEP: P2_BOILER_TYPE (Conditional) --- */}
           {step === 'P2_BOILER_TYPE' && (
            <StepLayout title="De quel type de chaudière s'agit-il ?">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <SelectionCard 
                   selected={data.boilerType === 'condensing'}
                   onClick={() => updateData({ boilerType: 'condensing' })}
                   label="Chaudière à condensation"
                   icon={<Factory className="w-12 h-12"/>}
                 />
                 <SelectionCard 
                   selected={data.boilerType === 'non-condensing'}
                   onClick={() => updateData({ boilerType: 'non-condensing' })}
                   label="Chaudière sans condensation"
                   icon={<Factory className="w-12 h-12 opacity-70"/>}
                 />
                 <SelectionCard 
                   selected={data.boilerType === 'unknown'}
                   onClick={() => updateData({ boilerType: 'unknown' })}
                   label="Je ne sais pas"
                   icon={<div className="text-4xl font-light text-slate-400">?</div>}
                 />
              </div>
              <div className="mt-8 flex justify-between max-w-4xl mx-auto w-full">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft size={16}/> Retour</Button>
                  <Button disabled={!data.boilerType} onClick={() => nextStep()}>Suivant <ArrowRight size={16}/></Button>
                </div>
            </StepLayout>
          )}

          {/* --- STEP: P2_FUEL_TYPE --- */}
          {step === 'P2_FUEL_TYPE' && (
             <StepLayout title="Comment chauffez-vous actuellement votre maison ?">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'gas', label: 'Gaz naturel', icon: '🔥' },
                    { id: 'oil', label: 'Mazout/Fioul', icon: '🛢️' },
                    { id: 'pellet', label: 'Pellets/Bois', icon: '🪵' },
                    { id: 'other', label: 'Autre', icon: '⚡' },
                  ].map((fuel) => (
                    <SelectionCard 
                      key={fuel.id}
                      selected={data.fuelType === fuel.id}
                      onClick={() => updateData({ fuelType: fuel.id as any })}
                      label={fuel.label}
                      icon={<span className="text-3xl">{fuel.icon}</span>}
                    />
                  ))}
                </div>
                <div className="mt-8 flex justify-between max-w-4xl mx-auto w-full">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft size={16}/> Retour</Button>
                  <Button disabled={!data.fuelType} onClick={() => nextStep()}>Suivant <ArrowRight size={16}/></Button>
                </div>
             </StepLayout>
          )}

          {/* --- STEP: P2_KNOW_CONSUMPTION --- */}
          {step === 'P2_KNOW_CONSUMPTION' && (
            <StepLayout 
              title="Connaissez-vous votre consommation annuelle d'énergie pour le chauffage ?"
              subtitle="Si vous avez vos factures sous la main, cela nous aide à être plus précis."
            >
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-lg mx-auto">
                 <button 
                    onClick={() => { updateData({ knowsConsumption: true }); setTimeout(() => nextStep(), 200); }}
                    className="p-8 border-2 border-gray-200 rounded-xl hover:border-brand-blue hover:shadow-lg transition flex flex-col items-center bg-white"
                 >
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <span className="text-xl font-bold text-slate-700">Oui</span>
                 </button>
                 <button 
                    onClick={() => { updateData({ knowsConsumption: false }); setTimeout(() => nextStep(), 200); }}
                    className="p-8 border-2 border-gray-200 rounded-xl hover:border-brand-blue hover:shadow-lg transition flex flex-col items-center bg-white"
                 >
                    <div className="w-16 h-16 rounded-full border-2 border-slate-300 flex items-center justify-center mb-4">
                      <span className="text-2xl text-slate-400">✕</span>
                    </div>
                    <span className="text-xl font-bold text-slate-700">Non</span>
                 </button>
               </div>
               <div className="mt-8 flex justify-start">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft size={16}/> Retour</Button>
               </div>
            </StepLayout>
          )}

          {/* --- STEP: P2_CONSUMPTION_AMOUNT --- */}
          {step === 'P2_CONSUMPTION_AMOUNT' && (
             <StepLayout title="Quelle est votre consommation annuelle ?">
                <div className="max-w-md mx-auto bg-slate-50 p-8 rounded-xl">
                   <div className="flex gap-4">
                      <div className="flex-grow">
                         <label className="block text-sm font-medium text-slate-700 mb-2">Quantité</label>
                         <input 
                           type="number" 
                           value={data.consumptionAmount}
                           onChange={(e) => updateData({ consumptionAmount: e.target.value })}
                           className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-brand-blue"
                           placeholder="Ex: 15000"
                         />
                      </div>
                      <div className="w-1/3">
                         <label className="block text-sm font-medium text-slate-700 mb-2">Unité</label>
                         <select 
                           value={data.consumptionUnit}
                           onChange={(e) => updateData({ consumptionUnit: e.target.value as any })}
                           className="w-full px-2 py-3 border border-gray-300 rounded-lg outline-none focus:border-brand-blue bg-white"
                         >
                           <option value="kWh">kWh</option>
                           <option value="m3">m³</option>
                           <option value="liters">Litres</option>
                           <option value="euros">Euros</option>
                         </select>
                      </div>
                   </div>
                </div>
                <div className="mt-8 flex justify-between max-w-4xl mx-auto w-full">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft size={16}/> Retour</Button>
                  <Button disabled={!data.consumptionAmount} onClick={() => nextStep()}>Suivant <ArrowRight size={16}/></Button>
                </div>
             </StepLayout>
          )}

          {/* --- STEP: P2_ENERGY_COST --- */}
          {step === 'P2_ENERGY_COST' && (
            <StepLayout title="Veuillez préciser vos dépenses énergétiques (coût approximatif)">
               <div className="max-w-md mx-auto bg-slate-50 p-8 rounded-xl">
                   <label className="block text-sm font-medium text-slate-700 mb-2">Montant annuel (€)</label>
                   <div className="relative">
                      <input 
                         type="number" 
                         value={data.energyCost}
                         onChange={(e) => updateData({ energyCost: e.target.value })}
                         className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg outline-none focus:border-brand-blue"
                         placeholder="Ex: 2000"
                      />
                      <Banknote className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                   </div>
                   <p className="text-xs text-slate-500 mt-2 flex gap-1 items-start">
                     <Info size={12} className="mt-0.5"/>
                     Une estimation suffit pour calculer vos économies potentielles.
                   </p>
               </div>
               <div className="mt-8 flex justify-between max-w-4xl mx-auto w-full">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft size={16}/> Retour</Button>
                  <Button disabled={!data.energyCost} onClick={() => nextStep()}>Terminer <ArrowRight size={16}/></Button>
                </div>
            </StepLayout>
          )}

          {/* --- STEP: FINAL_FORM --- */}
          {step === 'FINAL_FORM' && (
             <StepLayout 
                title="Votre solution idéale est prête !" 
                subtitle="Remplissez ce formulaire pour recevoir votre étude personnalisée et le détail de la machine sélectionnée."
             >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
                   
                   {/* Summary Card */}
                   <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden order-2 md:order-1">
                      <div className="bg-brand-blue p-4 text-white">
                         <h3 className="font-bold">Votre Sélection</h3>
                      </div>
                      <div className="p-6">
                         {data.selectedProduct && (
                            <div className="flex flex-col items-center mb-6 border-b border-gray-100 pb-6">
                               <img src={data.selectedProduct.image} className="w-48 h-auto object-cover rounded mb-2" alt="Product"/>
                               <h4 className="text-xl font-bold text-brand-dark">{data.selectedProduct.name}</h4>
                               <span className="text-sm text-slate-500">{data.selectedProduct.series}</span>
                            </div>
                         )}
                         <div className="space-y-3 text-sm text-slate-600">
                            <div className="flex justify-between">
                               <span>Besoin:</span>
                               <span className="font-medium text-slate-900">{data.need === 'both' ? 'Chauffage & Clim' : data.need === 'heating' ? 'Chauffage' : 'Climatisation'}</span>
                            </div>
                            <div className="flex justify-between">
                               <span>Pièces:</span>
                               <span className="font-medium text-slate-900">{data.rooms === '1' ? '1 Pièce' : 'Plusieurs pièces'}</span>
                            </div>
                            <div className="flex justify-between">
                               <span>Type:</span>
                               <span className="font-medium text-slate-900">
                                {data.unitType === 'air-water' ? 'PAC Air-Eau' : 
                                 data.unitType === 'wall' ? 'Mural' : 
                                 data.unitType === 'console' ? 'Console' : 'Gainable'}
                               </span>
                            </div>
                            <div className="flex justify-between">
                               <span>Surface:</span>
                               <span className="font-medium text-slate-900">
                                 {data.unitType === 'air-water' ? data.surfaceHouse : data.surfaceRoom}m²
                               </span>
                            </div>
                            <div className="flex justify-between">
                               <span>Code Postal:</span>
                               <span className="font-medium text-slate-900">{data.zipCode}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Contact Form */}
                   <div className="bg-slate-50 p-6 md:p-8 rounded-xl order-1 md:order-2">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Vos Coordonnées</h3>
                      <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-xs font-bold text-slate-500 uppercase">Prénom</label>
                               <div className="relative">
                                <input 
                                  type="text"
                                  className="w-full p-2 pl-8 border rounded focus:border-brand-blue outline-none"
                                  onChange={(e) => updateData({ contact: { ...data.contact, firstName: e.target.value }})}
                                />
                                <User className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                               </div>
                            </div>
                            <div>
                               <label className="text-xs font-bold text-slate-500 uppercase">Nom</label>
                               <input 
                                  type="text"
                                  className="w-full p-2 border rounded focus:border-brand-blue outline-none"
                                  onChange={(e) => updateData({ contact: { ...data.contact, lastName: e.target.value }})}
                                />
                            </div>
                         </div>
                         
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                            <div className="relative">
                              <input 
                                type="email"
                                className="w-full p-2 pl-8 border rounded focus:border-brand-blue outline-none"
                                onChange={(e) => updateData({ contact: { ...data.contact, email: e.target.value }})}
                              />
                              <Mail className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                            </div>
                         </div>

                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Téléphone</label>
                            <div className="relative">
                              <input 
                                type="tel"
                                className="w-full p-2 pl-8 border rounded focus:border-brand-blue outline-none"
                                onChange={(e) => updateData({ contact: { ...data.contact, phone: e.target.value }})}
                              />
                              <Phone className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                            </div>
                         </div>

                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Message (Optionnel)</label>
                            <textarea 
                              className="w-full p-2 border rounded focus:border-brand-blue outline-none h-24 resize-none"
                              onChange={(e) => updateData({ contact: { ...data.contact, message: e.target.value }})}
                            />
                         </div>

                         <Button 
                            fullWidth 
                            onClick={() => {
                              console.log("Submitting Payload to Joomla/Backend:", data);
                              alert("Merci ! Votre demande a été envoyée. (Simulation)");
                            }}
                         >
                            Envoyer ma demande
                         </Button>
                         <p className="text-xs text-center text-slate-400 mt-2">
                           Vos données sont confidentielles et utilisées uniquement pour votre étude.
                         </p>
                         
                         <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
                            <button 
                              onClick={resetConfig}
                              className="flex items-center gap-2 text-slate-400 hover:text-brand-blue transition-colors text-sm font-medium"
                            >
                              <RefreshCw size={14} /> 
                              Tout recommencer
                            </button>
                        </div>
                      </div>
                   </div>

                </div>
             </StepLayout>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white pt-12 pb-6 text-sm">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* COL 1: Froid Sud Energie */}
          <div>
            <h4 className="font-bold text-base mb-4 uppercase text-white">FROID SUD ENERGIE</h4>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Froid Sud Energie, société basée à Montpellier, intervient pour les particuliers ou les professionnels : vente, installation, dépannage entretien, ou maintenance.
            </p>
            <div className="flex gap-1">
              {/* Social Buttons with specific brand colors */}
              <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.clim34.fr%2F" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-[#3b5998] flex items-center justify-center hover:opacity-90 transition-opacity text-white">
                 <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
              </a>
              <a href="https://plus.google.com/share?url=https%3A%2F%2Fwww.clim34.fr%2F" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-[#dd4b39] flex items-center justify-center hover:opacity-90 transition-opacity text-white">
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 11v2.4h3.97c-.16 1.029-1.2 3.02-3.97 3.02-2.39 0-4.34-1.979-4.34-4.42 0-2.44 1.95-4.42 4.34-4.42 1.36 0 2.27.58 2.79 1.08l1.9-1.83c-1.22-1.14-2.8-1.83-4.69-1.83-3.87 0-7 3.13-7 7s3.13 7 7 7c4.04 0 6.721-2.84 6.721-6.84 0-.46-.051-.81-.111-1.16h-6.61zm0 0 17 2h-2.5v2.5h-2v-2.5h-2.5v-2h2.5v-2.5h2v2.5h2.5v2z"/></svg>
              </a>
              <a href="https://twitter.com/intent/tweet?text=Climatisation%2C+pompes+%26agrave%3B+chaleur%2C+r%26eacute%3Bfrig%26eacute%3Bration+et+mat%26eacute%3Briel+chr+%7C+Clim34%20https%3A%2F%2Fwww.clim34.fr%2F" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-[#55acee] flex items-center justify-center hover:opacity-90 transition-opacity text-white">
                 <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="http://tumblr.com/share?s=&v=3&t=Climatisation%2C+pompes+%26agrave%3B+chaleur%2C+r%26eacute%3Bfrig%26eacute%3Bration+et+mat%26eacute%3Briel+chr+%7C+Clim34&u=https%3A%2F%2Fwww.clim34.fr%2F" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-[#34465d] flex items-center justify-center hover:opacity-90 transition-opacity text-white">
                 <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411v-9.147h-2.438c-.875 0-1.438-.44-1.438-1.321 0-4.053 2.919-6.924 7.629-6.924h1.536v-6.911h6.634v12.754h4.482v5.725h-4.482c0 2.924 1.705 3.633 3.352 3.633.371 0 .708-.021 1.096-.062l.065 5.899c-1.395.421-4.721.765-9.405.765z"/></svg>
              </a>
            </div>
          </div>

          {/* COL 2: NOUS CONTACTER */}
          <div>
            <h4 className="font-bold text-base mb-4 uppercase text-[#009fe3]">NOUS CONTACTER</h4>
            <div className="space-y-4 text-gray-300">
              <div>
                 <strong className="text-white block mb-1">Téléphone</strong>
                 <p className="flex items-center gap-2">0970 468 458 (non surtaxé)</p>
                 <p>06 01 76 58 85</p>
              </div>
              <div>
                 <strong className="text-white block mb-1">Mail :</strong>
                 <a href="mailto:froidsudenergie@gmail.com" className="hover:text-white transition-colors">froidsudenergie@gmail.com</a>
              </div>
              <div>
                 <strong className="text-white block mb-1">Adresse</strong>
                 <p>17 Bis Rue Albert Leenhardt</p>
                 <p>34000 Montpellier</p>
              </div>
            </div>
          </div>

          {/* COL 3: NOS DOCUMENTS ADMINISTRATIFS */}
          <div>
            <h4 className="font-bold text-base mb-4 uppercase text-white">NOS DOCUMENTS ADMINISTRATIFS</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="https://www.clim34.fr/images/PDF/Froidsudnrj2023.pdf" target="_blank" className="hover:text-white flex justify-between items-center group text-xs border-b border-gray-700 pb-2">
                  <span>Télécharger nos documents administratifs</span>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-white"/>
                </a>
              </li>
              <li>
                <a href="https://www.clim34.fr/images/pdf/Attestation_de_capacit_FROIDSUDENEGIE2021.pdf" target="_blank" className="hover:text-white group text-xs border-b border-gray-700 pb-2 block">
                   <span className="block mb-1 font-bold text-gray-300">N° d’attestation de capacité :</span>
                   <span className="flex justify-between items-center">
                      <span>ACO / SQ13233-01</span>
                      <ChevronRight size={14} className="text-gray-600 group-hover:text-white"/>
                   </span>
                </a>
              </li>
              <li>
                <a href="https://www.clim34.fr/images/PDF/RGE2023.pdf" target="_blank" className="hover:text-white group text-xs border-b border-gray-700 pb-2 block">
                   <span className="block mb-1 font-bold text-gray-300">Certification RGE 2024 :</span>
                   <span className="flex justify-between items-center">
                      <span>QPAC/62021</span>
                      <ChevronRight size={14} className="text-gray-600 group-hover:text-white"/>
                   </span>
                </a>
              </li>
              <li>
                <a href="https://www.clim34.fr/images/PDF/KBIS-2024-FROIDSUDENERGIE.pdf" target="_blank" className="hover:text-white flex justify-between items-center group text-xs border-b border-gray-700 pb-2">
                  <span>Notre Kbis 2024</span>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-white"/>
                </a>
              </li>
              <li>
                <a href="https://www.clim34.fr/mieux-nous-connaitre/mentions-legales-froid-sud-energie.html" target="_blank" className="hover:text-white flex justify-between items-center group text-xs border-b border-gray-700 pb-2">
                  <span>Mentions légales</span>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-white"/>
                </a>
              </li>
            </ul>
          </div>

          {/* COL 4: LIENS RAPIDES */}
          <div>
            <h4 className="font-bold text-base mb-4 uppercase text-white">LIENS RAPIDES</h4>
            <ul className="space-y-0 text-gray-400 border-t border-gray-800">
               {[
                 { label: 'Devis', url: 'https://www.clim34.fr/devis-climatisation.html' },
                 { label: 'Nos promotions', url: 'https://www.clim34.fr/toute-nos-promotions-climatisations-et-materiel-pro/nos-promotions-climatisations-et-materiel-pro.html' },
                 { label: 'Qui sommes nous ?', url: 'https://www.clim34.fr/mieux-nous-connaitre/qui-sommes-nous.html' },
                 { label: 'Formulaire de contact', url: 'https://www.clim34.fr/non-categorise/contact.html' },
                 { label: 'Espace téléchargement', url: 'https://www.clim34.fr/documentation-climatisation.html' },
                 { label: 'Plan de site', url: 'https://www.clim34.fr/plan-du-site.html' },
               ].map((link, idx) => (
                 <li key={idx}>
                    <a href={link.url} className="flex justify-between items-center py-3 border-b border-gray-800 hover:text-white group transition-colors text-xs">
                       <span>{link.label}</span>
                       <ChevronRight size={14} className="text-gray-600 group-hover:text-white"/>
                    </a>
                 </li>
               ))}
            </ul>
          </div>

        </div>
        
        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between text-gray-500 text-xs gap-4">
          <p>© {new Date().getFullYear()} Froid Sud Energie. Tous droits réservés.</p>
          <p>
            Réalisé par <a href="https://www.elvisweb.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-medium">Elvis Web</a>
          </p>
        </div>
      </footer>
    </div>
  );
}