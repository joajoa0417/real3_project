import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import MainHome from './MainHome';
import IndexedDBService, { User, UserStock } from './src/services/IndexedDBService';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userStocks, setUserStocks] = useState<UserStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await IndexedDBService.initDatabase();
      setIsLoading(false);
    } catch (error) {
      console.error('앱 초기화 오류:', error);
      setIsLoading(false);
    }
  };

  const handleLogin = async (userId: string, password: string) => {
    try {
      console.log('App.tsx - 로그인 시도:', userId, password);
      
      const user = await IndexedDBService.authenticateUser(userId, password);
      console.log('IndexedDB 인증 결과:', user);
      
      if (user) {
        console.log('사용자 인증 성공, 보유종목 조회 중...');
        const stocks = await IndexedDBService.getUserStocks(userId);
        console.log('보유종목 조회 결과:', stocks);
        setCurrentUser(user);
        setUserStocks(stocks);
        setIsLoggedIn(true);
        console.log('로그인 완료');
      } else {
        console.log('사용자 인증 실패');
        alert('로그인에 실패했습니다. 사용자 ID와 비밀번호를 확인해주세요.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다: ' + error);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserStocks([]);
  };

  if (isLoading) {
    return null; // 로딩 중에는 빈 화면 표시
  }

  console.log('App에서 MainHome에 전달하는 props:', {
    currentUser,
    userStocks,
    onLogout: handleLogout,
    onLogin: handleLogin,
    isLoggedIn
  });

  const mainHomeProps = {
    currentUser,
    userStocks,
    onLogout: handleLogout,
    onLogin: handleLogin,
    isLoggedIn
  };

  console.log('mainHomeProps 객체:', mainHomeProps);

  return (
    <>
      <StatusBar style="light" />
      <MainHome {...mainHomeProps} />
    </>
  );
} 