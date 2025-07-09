'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignInButton } from '@clerk/nextjs';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FiMapPin, 
  FiSearch, 
  FiBookmark, 
  FiBell, 
  FiTrendingUp,
  FiX,
  FiCheckCircle,
  FiZap
} from 'react-icons/fi';
import { trackEvent } from '@/lib/gtm/gtm';
import { cn } from '@/lib/utils';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchData?: {
    location: string;
    query?: string;
    resultsCount?: number;
  };
  trigger?: string;
}

const features = [
  {
    icon: FiSearch,
    title: 'Búsquedas ilimitadas',
    description: 'Sin restricciones diarias',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: FiBookmark,
    title: 'Guarda tus favoritos',
    description: 'Crea tu lista personalizada',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: FiBell,
    title: 'Alertas de inventario',
    description: 'Notificaciones instantáneas',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: FiTrendingUp,
    title: 'Análisis avanzado',
    description: 'Insights del mercado',
    color: 'from-orange-500 to-red-500',
  },
];

export function RegistrationModal({ 
  isOpen, 
  onClose, 
  searchData,
  trigger = 'search_limit' 
}: RegistrationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      trackEvent.registrationModalShown(trigger);
    }
  }, [isOpen, mounted, trigger]);

  const handleClose = () => {
    trackEvent.registrationModalDismissed(trigger);
    onClose();
  };

  const handleSignInClick = (method: string) => {
    trackEvent.registrationCompleted(method, trigger);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-0">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header with animated gradient */}
              <DialogHeader className="relative p-6 pb-4">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    backgroundSize: '200% 200%',
                  }}
                />
                
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.1 
                    }}
                    className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-4"
                  >
                    <FiZap className="w-6 h-6" />
                  </motion.div>
                  
                  <motion.h2 
                    className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Desbloquea el poder completo de Karmatic
                  </motion.h2>
                  
                  {searchData && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-3 flex items-center gap-2"
                    >
                      <FiMapPin className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Tu búsqueda en <span className="font-semibold">{searchData.location}</span>
                        {searchData.resultsCount && (
                          <> encontró <Badge variant="secondary" className="ml-1">{searchData.resultsCount} agencias</Badge></>
                        )}
                      </p>
                    </motion.div>
                  )}
                </div>
              </DialogHeader>

              {/* Features grid */}
              <div className="px-6 py-4">
                <motion.div 
                  className="grid grid-cols-2 gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      onHoverStart={() => setHoveredFeature(index)}
                      onHoverEnd={() => setHoveredFeature(null)}
                      className={cn(
                        "relative p-4 rounded-xl border transition-all duration-300 cursor-pointer",
                        "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
                        "hover:shadow-lg hover:scale-[1.02]",
                        hoveredFeature === index 
                          ? "border-gray-300 dark:border-gray-600" 
                          : "border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <motion.div
                        className={cn(
                          "inline-flex p-2 rounded-lg bg-gradient-to-r text-white mb-2",
                          feature.color
                        )}
                        animate={{
                          scale: hoveredFeature === index ? 1.1 : 1,
                          rotate: hoveredFeature === index ? 5 : 0,
                        }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <feature.icon className="w-4 h-4" />
                      </motion.div>
                      
                      <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* CTA section */}
              <div className="p-6 pt-2 space-y-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-3"
                >
                  <SignInButton mode="modal">
                    <Button 
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => handleSignInClick('google')}
                    >
                      <FiCheckCircle className="mr-2 h-5 w-5" />
                      Crear cuenta gratuita
                    </Button>
                  </SignInButton>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full h-10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    onClick={handleClose}
                  >
                    Continuar con límites
                  </Button>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex items-center justify-center gap-4 pt-2"
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Sin tarjeta de crédito
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Cancela cuando quieras
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleClose}
            >
              <FiX className="h-4 w-4" />
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}