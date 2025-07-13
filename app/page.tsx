"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      <Header />

      <main className="relative flex flex-col items-center justify-center flex-1 text-center pt-20 px-4">
        {/* Фоновое изображение */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg.jpg"
            alt="Hero background"
            fill
            className="object-cover z-0"
          />
          <div className="absolute inset-0 bg-black opacity-40" />
        </div>

        {/* Текст и кнопки */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-lg">
            Найдите квартиру мечты в Кыргызстане
          </h1>
          <p className="mt-4 text-base sm:text-xl text-white drop-shadow">
            Вся новая недвижимость и застройщики в одном месте.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="w-full sm:w-auto px-6 py-3 bg-orange-500 text-white rounded-xl text-base sm:text-lg font-semibold shadow-lg"
              onClick={() => router.push("/projects")}
            >
              Смотреть новостройки
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="w-full sm:w-auto px-6 py-3 bg-white text-orange-500 rounded-xl text-base sm:text-lg font-semibold shadow-lg border border-orange-500"
              onClick={() => router.push("/developers")}
            >
              Все застройщики
            </motion.button>
          </div>
        </motion.div>

        {/* Секция для застройщиков */}
        <section className="relative z-10 mt-20 max-w-6xl w-full px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="bg-white bg-opacity-95 rounded-2xl shadow-lg p-8 md:p-12"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              Здесь могут быть ваши объекты
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-50 rounded-xl p-6 border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors">
                <div className="w-full h-40 bg-slate-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-slate-400 text-sm font-medium">Место для вашего проекта</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Ваш проект №1
                </h3>
                <p className="text-slate-600 text-sm">
                  Красивая презентация с галереей изображений
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors">
                <div className="w-full h-40 bg-slate-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-slate-400 text-sm font-medium">Место для вашего проекта</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Ваш проект №2
                </h3>
                <p className="text-slate-600 text-sm">
                  Детальная информация о квартирах и планировках
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors">
                <div className="w-full h-40 bg-slate-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-slate-400 text-sm font-medium">Место для вашего проекта</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Ваш проект №3
                </h3>
                <p className="text-slate-600 text-sm">
                  Привлечение клиентов через современную платформу
                </p>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Разместите свои проекты на URPAK.KG
              </h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Привлекайте больше покупателей через современную платформу недвижимости
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  onClick={() => router.push("/contacts")}
                >
                  Разместить проект
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                  onClick={() => router.push("/developers")}
                >
                  Смотреть примеры
                </motion.button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-slate-600 text-xl">📱</span>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">Мобильная версия</h4>
                <p className="text-slate-600 text-sm">70% клиентов ищут жилье с телефона</p>
              </div>

              <div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-slate-600 text-xl">🎯</span>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">Целевая аудитория</h4>
                <p className="text-slate-600 text-sm">Только заинтересованные покупатели</p>
              </div>

              <div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-slate-600 text-xl">📈</span>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">Рост продаж</h4>
                <p className="text-slate-600 text-sm">Увеличьте количество заявок</p>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
