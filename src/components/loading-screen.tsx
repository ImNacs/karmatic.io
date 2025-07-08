"use client"

import { motion } from "motion/react"
import { FiMapPin, FiSearch, FiTarget } from "react-icons/fi"

interface LoadingScreenProps {
  title?: string
  subtitle?: string
  type?: "search" | "analysis"
}

export function LoadingScreen({ 
  title = "Buscando agencias...", 
  subtitle = "Estamos analizando las mejores opciones cerca de ti",
  type = "search" 
}: LoadingScreenProps) {
  const icons = type === "search" ? [FiSearch, FiMapPin, FiTarget] : [FiTarget, FiSearch, FiMapPin]

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            {icons.map((Icon, index) => (
              <motion.div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              >
                <Icon className="h-8 w-8 text-primary" />
              </motion.div>
            ))}
            <div className="w-16 h-16 rounded-full border-2 border-muted" />
          </div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-semibold mb-2"
        >
          {title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-6"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
          </div>
          <p className="text-sm text-muted-foreground">
            {type === "search" ? "Esto puede tomar unos segundos..." : "Analizando inventario y datos..."}
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}